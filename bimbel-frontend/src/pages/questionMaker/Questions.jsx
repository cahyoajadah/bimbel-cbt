// bimbel-frontend/src/pages/questionMaker/Questions.jsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ArrowLeft, X, ListPlus, Eye } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Button } from '../../components/common/Button';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import toast from 'react-hot-toast';

import ReactQuill from 'react-quill'; 
import 'react-quill/dist/quill.snow.css'; 
import 'katex/dist/katex.min.css'; 
import katex from 'katex';
window.katex = katex; 

export default function Questions() {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // --- KONFIGURASI EDITOR ---
  const getModules = (isSimple = false) => ({
    toolbar: {
        container: isSimple 
            ? [['bold', 'italic', 'underline', 'formula', 'image'], ['clean']]
            : [
                [{ 'header': [1, 2, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image', 'formula'],
                ['clean']
              ],
        handlers: {
            image: function() {
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');
                input.click();

                input.onchange = async () => {
                    const file = input.files[0];
                    if (file) {
                        const formData = new FormData();
                        formData.append('image', file);
                        const loadingToast = toast.loading('Mengupload gambar...');
                        try {
                            const res = await api.post('/upload-image', formData, {
                                headers: { 'Content-Type': 'multipart/form-data' }
                            });
                            const range = this.quill.getSelection();
                            this.quill.insertEmbed(range.index, 'image', res.data.url);
                        } catch (err) {
                            console.error(err);
                            toast.error('Gagal upload gambar.');
                        } finally {
                            toast.dismiss(loadingToast);
                        }
                    }
                };
            }
        }
    }
  });

  const mainModules = useMemo(() => getModules(false), []);
  const simpleModules = useMemo(() => getModules(true), []);

  // --- DATA FETCHING ---
  const { data: packageData } = useQuery({
    queryKey: ['question-package', packageId],
    queryFn: async () => {
      const res = await api.get(`${API_ENDPOINTS.QUESTION_PACKAGES}/${packageId}`);
      return res.data.data; 
    },
  });

  const { data: questionsData, isLoading } = useQuery({
    queryKey: ['questions', packageId],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.QUESTIONS(packageId));
      return res.data.data;
    },
  });

  const questions = Array.isArray(questionsData?.questions) ? questionsData.questions : (Array.isArray(questionsData) ? questionsData : []);
  const categories = packageData?.categories || [];

  // --- FORM HANDLING ---
  const { 
    register, control, handleSubmit, reset, watch, setValue, formState: { errors } 
  } = useForm({
    defaultValues: {
      question_category_id: '',
      type: 'single',
      question_text: '',
      point: 5,
      explanation: '',
      options: [
        { label: 'A', text: '', is_correct: false, weight: 0 },
        { label: 'B', text: '', is_correct: false, weight: 0 },
        { label: 'C', text: '', is_correct: false, weight: 0 },
        { label: 'D', text: '', is_correct: false, weight: 0 },
      ],
      short_answer_key: ''
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "options" });
  const watchedType = watch('type');
  const watchedOptions = watch('options');

  const handleSingleCorrectChange = (index) => {
    const updated = watchedOptions.map((opt, i) => ({ ...opt, is_correct: i === index }));
    setValue('options', updated);
  };

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: (data) => {
      if (!data.question_category_id) throw new Error("Kategori wajib dipilih!");

      const payload = { ...data };
      if (data.explanation) payload.discussion = data.explanation;

      // Format Options
      if (payload.type === 'short') {
        // [FIX] Mengganti 'option_text' menjadi 'text' agar terbaca oleh backend
        payload.options = [{ text: data.short_answer_key, is_correct: true, weight: 0 }];
      } else {
        payload.options = data.options.map((opt, idx) => ({
          ...opt, text: opt.text, label: String.fromCharCode(65 + idx)
        }));
      }
      return api.post(API_ENDPOINTS.QUESTIONS(packageId), payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['questions', packageId]);
      setIsModalOpen(false);
      reset();
      toast.success('Soal berhasil dibuat');
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Gagal membuat soal')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const payload = { ...data };
      if (data.explanation) payload.discussion = data.explanation;
      
      if (payload.type === 'short') {
        // [FIX] Mengganti 'option_text' menjadi 'text'
        payload.options = [{ text: data.short_answer_key, is_correct: true, weight: 0 }];
      } else {
        payload.options = data.options.map((opt, idx) => ({
          ...opt, text: opt.text, label: String.fromCharCode(65 + idx)
        }));
      }
      return api.put(API_ENDPOINTS.QUESTION_DETAIL(packageId, id), payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['questions', packageId]);
      setIsModalOpen(false);
      setEditingQuestion(null);
      reset();
      toast.success('Soal berhasil diperbarui');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(API_ENDPOINTS.QUESTION_DETAIL(packageId, id)),
    onSuccess: () => {
      queryClient.invalidateQueries(['questions', packageId]);
      toast.success('Soal berhasil dihapus');
    },
  });

  // --- HANDLE OPEN MODAL ---
  const handleOpenModal = (question = null) => {
    if (question) {
      setEditingQuestion(question);
      
      // Ambil opsi jawaban
      const rawOptions = question.answer_options || question.options || []; 
      
      let formattedOptions = rawOptions.map(opt => ({
        id: opt.id,
        label: opt.option_label || opt.label || '', 
        text: opt.option_text || opt.text || '', 
        is_correct: Boolean(opt.is_correct),
        weight: parseInt(opt.weight || 0)
      }));

      // Logic khusus untuk Isian Singkat (Ambil kunci yang tersimpan)
      let shortAnswerKey = '';
      if (question.type === 'short') {
        const correctOpt = formattedOptions.find(o => o.is_correct);
        // Pastikan mengambil text, karena di backend tersimpan di option_text yang dimapping jadi 'text' di getQuestions
        shortAnswerKey = correctOpt ? correctOpt.text : '';
      }

      // Fallback jika opsi kosong (bukan short answer)
      if (formattedOptions.length === 0 && question.type !== 'short') {
          formattedOptions = [
            { label: 'A', text: '', is_correct: false, weight: 0 },
            { label: 'B', text: '', is_correct: false, weight: 0 },
            { label: 'C', text: '', is_correct: false, weight: 0 },
            { label: 'D', text: '', is_correct: false, weight: 0 },
          ];
      }

      reset({
        question_category_id: question.question_category_id || (question.category ? question.category.id : ''),
        type: question.type || 'single',
        question_text: question.question_text || '',
        point: question.point,
        explanation: question.explanation || question.discussion || '', 
        options: formattedOptions, 
        short_answer_key: shortAnswerKey
      });

    } else {
      setEditingQuestion(null);
      const defaultCat = categories.length === 1 ? categories[0].id : '';
      
      reset({
        question_category_id: defaultCat,
        type: 'single',
        question_text: '',
        point: 5,
        explanation: '',
        short_answer_key: '',
        options: [
            { label: 'A', text: '', is_correct: false, weight: 0 },
            { label: 'B', text: '', is_correct: false, weight: 0 },
            { label: 'C', text: '', is_correct: false, weight: 0 },
            { label: 'D', text: '', is_correct: false, weight: 0 },
        ]
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data) => {
    // Validasi Logic Soal
    if (data.type === 'single' && data.options.filter(opt => opt.is_correct).length !== 1) {
        return toast.error('Pilih tepat 1 jawaban benar');
    }
    if (data.type === 'multiple' && data.options.filter(opt => opt.is_correct).length < 1) {
        return toast.error('Pilih minimal 1 jawaban benar');
    }

    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (question) => {
    showConfirm({
      title: 'Hapus Soal',
      message: `Hapus soal no. ${question.order_number}?`,
      type: 'danger',
      confirmText: 'Hapus',
      onConfirm: () => deleteMutation.mutate(question.id),
    });
  };

  const stripHtml = (html) => {
     const tmp = document.createElement("DIV");
     tmp.innerHTML = html;
     return tmp.textContent || tmp.innerText || "";
  };

  const columns = [
    { header: 'No.', accessor: 'order_number' },
    { 
      header: 'Kategori', 
      render: (row) => (
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold border border-blue-100">
            {row.category?.name || '-'}
        </span>
      )
    },
    { 
      header: 'Tipe', 
      render: (row) => {
        const types = { single: 'PG', multiple: 'PG Kom.', weighted: 'Bobot', short: 'Isian' };
        return <span className="text-xs text-gray-600">{types[row.type] || row.type}</span>;
      }
    },
    { 
      header: 'Pertanyaan', 
      render: (row) => (
         <div className="max-w-xs truncate text-sm" title={stripHtml(row.question_text)}>
            {stripHtml(row.question_text)}
         </div>
      ) 
    },
    { header: 'Poin', accessor: 'point' },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="ghost" icon={Eye} onClick={() => { setEditingQuestion(row); setIsPreviewOpen(true); }} />
          <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenModal(row)} />
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDelete(row)} className="text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/question-maker/packages')}>
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{packageData?.name || '...'}</h1>
            <p className="text-sm text-gray-600">Kelola soal per kategori</p>
          </div>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Buat Soal Baru</Button>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={questions} loading={isLoading} emptyMessage="Belum ada soal." />
      </div>

      {/* MODAL PREVIEW */}
      <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title="Preview Soal" size="lg">
        {editingQuestion && (
           <div className="space-y-4">
              <div className="flex gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">
                      {editingQuestion.category?.name}
                  </span>
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                      Poin: {editingQuestion.point}
                  </span>
              </div>
              <div className="p-4 bg-gray-50 rounded border prose max-w-none ql-editor" dangerouslySetInnerHTML={{ __html: editingQuestion.question_text }} />
              <div className="grid gap-2">
                 {(editingQuestion.answer_options || editingQuestion.options || []).map((opt, idx) => (
                    <div key={idx} className={`p-2 border rounded flex ${opt.is_correct ? 'bg-green-50 border-green-300' : 'bg-white'}`}>
                        <span className="font-bold mr-2">{opt.option_label || opt.label || String.fromCharCode(65+idx)}.</span>
                        <div dangerouslySetInnerHTML={{ __html: opt.option_text || opt.text }} />
                    </div>
                 ))}
              </div>
              <div className="flex justify-end"><Button onClick={() => setIsPreviewOpen(false)}>Tutup</Button></div>
           </div>
        )}
      </Modal>

      {/* MODAL FORM SOAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingQuestion ? 'Edit Soal' : 'Buat Soal Baru'}
        size="2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
                <label className="block text-sm font-bold text-orange-900 mb-1">Kategori Soal <span className="text-red-500">*</span></label>
                <select 
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    {...register('question_category_id', { required: 'Kategori wajib dipilih' })}
                >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name} (Passing Grade: {cat.passing_grade})</option>
                    ))}
                </select>
                {errors.question_category_id && <p className="text-red-600 text-xs mt-1">{errors.question_category_id.message}</p>}
                {categories.length === 0 && (
                    <p className="text-xs text-red-500 mt-1 italic">Paket ini belum punya kategori. Tambahkan kategori di menu Paket terlebih dahulu.</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Soal</label>
                <select 
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    {...register('type')}
                >
                    <option value="single">Pilihan Ganda (Standar)</option>
                    <option value="multiple">Pilihan Ganda Kompleks</option>
                    <option value="weighted">Bobot Nilai (TKD/CPNS)</option>
                    <option value="short">Isian Singkat</option>
                </select>
            </div>
            
            <Input 
                label="Poin Soal" 
                type="number" 
                {...register('point', { valueAsNumber: true })} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pertanyaan</label>
            <div className="h-64 mb-8"> 
                <Controller
                    name="question_text"
                    control={control}
                    rules={{ required: 'Pertanyaan wajib diisi' }}
                    render={({ field }) => (
                        <ReactQuill 
                            theme="snow"
                            value={field.value || ''} 
                            onChange={field.onChange}
                            modules={mainModules}
                            className="h-56"
                            placeholder="Tulis soal..."
                        />
                    )}
                />
            </div>
            {errors.question_text && <p className="text-red-500 text-xs mt-1">{errors.question_text.message}</p>}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-bold text-gray-800">
                    {watchedType === 'short' ? 'Kunci Jawaban' : 'Opsi Jawaban'}
                </label>
                
                {watchedType !== 'short' && (
                    <Button type="button" size="sm" variant="outline" icon={ListPlus} onClick={() => append({ label: '', text: '', is_correct: false, weight: 0 })}>
                        Tambah Opsi
                    </Button>
                )}
            </div>

            {watchedType === 'short' ? (
                <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                    <Input placeholder="Jawaban singkat..." {...register('short_answer_key', { required: true })} />
                </div>
            ) : (
                <div className="space-y-3">
                    {fields.map((item, index) => (
                        <div key={item.id} className="flex items-start gap-3 p-3 border rounded bg-gray-50">
                            <div className="pt-2 flex flex-col items-center">
                                <span className="font-bold text-gray-500">{String.fromCharCode(65 + index)}</span>
                                {watchedType === 'single' && (
                                    <input type="radio" className="mt-2" checked={watchedOptions?.[index]?.is_correct} onChange={() => handleSingleCorrectChange(index)} />
                                )}
                                {watchedType === 'multiple' && (
                                    <input type="checkbox" className="mt-2" {...register(`options.${index}.is_correct`)} />
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="bg-white">
                                    <Controller
                                        name={`options.${index}.text`}
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <ReactQuill theme="snow" value={field.value || ''} onChange={field.onChange} modules={simpleModules} placeholder="Teks opsi..." />
                                        )}
                                    />
                                </div>
                                {watchedType === 'weighted' && (
                                    <input type="number" placeholder="Bobot" className="w-20 rounded border p-1 text-sm" {...register(`options.${index}.weight`, { valueAsNumber: true })} />
                                )}
                            </div>
                            <button type="button" onClick={() => remove(index)} className="text-gray-400 hover:text-red-500"><X size={18} /></button>
                        </div>
                    ))}
                </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pembahasan</label>
            <div className="h-40 mb-8">
                <Controller
                    name="explanation"
                    control={control}
                    render={({ field }) => (
                        <ReactQuill theme="snow" value={field.value || ''} onChange={field.onChange} modules={mainModules} className="h-32" />
                    )}
                />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}