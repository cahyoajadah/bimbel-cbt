import { useState, useMemo, useRef } from 'react';
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

// Import React Quill & Katex
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

  // Ref untuk instance Quill (tidak wajib dipakai langsung jika pakai modules custom)
  const quillRef = useRef(null); 

  // Konfigurasi Modules Quill dengan Handler Upload Gambar Custom
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
                            
                            const url = res.data.url;
                            const range = this.quill.getSelection();
                            this.quill.insertEmbed(range.index, 'image', url);
                            
                        } catch (err) {
                            console.error(err);
                            toast.error('Gagal upload gambar. Pastikan file < 2MB');
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

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike', 
    'color', 'background', 'list', 'bullet', 
    'link', 'image', 'formula'
  ];

  // Fetch Package Info
  const { data: packageData } = useQuery({
    queryKey: ['question-package', packageId],
    queryFn: async () => {
      const res = await api.get(`${API_ENDPOINTS.QUESTION_PACKAGES}/${packageId}`);
      return res.data.data;
    },
  });

  // Fetch Questions
  const { data: questionsData, isLoading } = useQuery({
    queryKey: ['questions', packageId],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.QUESTIONS(packageId));
      return res.data.data;
    },
  });

  const questions = Array.isArray(questionsData?.questions) ? questionsData.questions : (Array.isArray(questionsData) ? questionsData : []);

  // Form Handling
  const { 
    register, control, handleSubmit, reset, watch, setValue, formState: { errors } 
  } = useForm({
    defaultValues: {
      type: 'single',
      category: 'General', // [BARU] Default kategori
      question_text: '',
      duration_seconds: 60,
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options"
  });

  const watchedType = watch('type');
  const watchedOptions = watch('options');

  const handleSingleCorrectChange = (index) => {
    const currentOptions = watchedOptions;
    const updated = currentOptions.map((opt, i) => ({
      ...opt,
      is_correct: i === index 
    }));
    setValue('options', updated);
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data };
      if (data.explanation) payload.discussion = data.explanation;

      if (payload.type === 'short') {
        payload.options = [{
          option_text: data.short_answer_key, 
          is_correct: true,
          weight: 0
        }];
      } else {
        payload.options = data.options.map((opt, idx) => ({
          ...opt,
          option_text: opt.text, 
          label: String.fromCharCode(65 + idx)
        }));
      }

      const res = await api.post(API_ENDPOINTS.QUESTIONS(packageId), payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['questions', packageId]);
      queryClient.invalidateQueries(['question-package', packageId]);
      setIsModalOpen(false);
      reset();
      toast.success('Soal berhasil dibuat');
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || 'Gagal membuat soal');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const payload = { ...data };
      if (data.explanation) payload.discussion = data.explanation;
      
      if (payload.type === 'short') {
        payload.options = [{
          option_text: data.short_answer_key,
          is_correct: true,
          weight: 0
        }];
      } else {
        payload.options = data.options.map((opt, idx) => ({
          ...opt,
          option_text: opt.text,
          label: String.fromCharCode(65 + idx)
        }));
      }

      const res = await api.put(API_ENDPOINTS.QUESTION_DETAIL(packageId, id), payload);
      return res.data;
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
    mutationFn: async (id) => {
      await api.delete(API_ENDPOINTS.QUESTION_DETAIL(packageId, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['questions', packageId]);
      toast.success('Soal berhasil dihapus');
    },
  });

  const handleOpenModal = (question = null) => {
    if (question) {
      setEditingQuestion(question);
      
      const rawOptions = question.answer_options || question.options || [];
      
      let formattedOptions = rawOptions.map(opt => ({
        id: opt.id,
        label: opt.option_label || opt.label, 
        text: opt.option_text || opt.text || opt.answer_text || '', 
        is_correct: Boolean(opt.is_correct),
        weight: parseInt(opt.weight || 0)
      }));

      let shortAnswerKey = '';
      if (question.type === 'short') {
        const correctOpt = formattedOptions.find(o => o.is_correct);
        shortAnswerKey = correctOpt ? correctOpt.text : '';
      }

      if (formattedOptions.length === 0 && question.type !== 'short') {
          formattedOptions = [
            { label: 'A', text: '', is_correct: false, weight: 0 },
            { label: 'B', text: '', is_correct: false, weight: 0 },
            { label: 'C', text: '', is_correct: false, weight: 0 },
            { label: 'D', text: '', is_correct: false, weight: 0 },
          ];
      }

      reset({
        type: question.type || 'single',
        category: question.category || 'General', // [BARU] Load kategori saat edit
        question_text: question.question_text || '',
        duration_seconds: question.duration_seconds,
        point: question.point,
        explanation: question.explanation || question.discussion || '', 
        options: formattedOptions, 
        short_answer_key: shortAnswerKey
      });
    } else {
      setEditingQuestion(null);
      reset({
        type: 'single',
        category: 'General', // [BARU] Default kategori baru
        question_text: '',
        duration_seconds: 60,
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
    if (data.type === 'single') {
        const correctCount = data.options.filter(opt => opt.is_correct).length;
        if (correctCount !== 1) return toast.error('Pilih tepat 1 jawaban benar untuk Pilihan Ganda');
    }
    
    if (data.type === 'multiple') {
        const correctCount = data.options.filter(opt => opt.is_correct).length;
        if (correctCount < 1) return toast.error('Pilih minimal 1 jawaban benar untuk Pilihan Ganda Kompleks');
    }

    if (data.type === 'weighted') {
        const hasWeight = data.options.some(opt => opt.weight > 0);
        if (!hasWeight) return toast.error('Minimal satu opsi harus memiliki bobot nilai > 0');
    }

    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (question) => {
    if (showConfirm) {
        showConfirm({
          title: 'Hapus Soal',
          message: `Hapus soal no. ${question.order_number}?`,
          type: 'danger',
          confirmText: 'Hapus',
          onConfirm: () => deleteMutation.mutate(question.id),
        });
    } else {
        if (window.confirm(`Hapus soal no. ${question.order_number}?`)) {
            deleteMutation.mutate(question.id);
        }
    }
  };

  const stripHtml = (html) => {
     const tmp = document.createElement("DIV");
     tmp.innerHTML = html;
     return tmp.textContent || tmp.innerText || "";
  };

  const columns = [
    { header: 'No.', accessor: 'order_number' },
    { 
      header: 'Tipe', 
      render: (row) => {
        const types = {
            single: 'Pilihan Ganda',
            multiple: 'Kompleks',
            weighted: 'Bobot (TKD)',
            short: 'Isian'
        };
        return <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">{types[row.type] || row.type}</span>;
      }
    },
    // [BARU] Kolom Kategori di Tabel
    {
      header: 'Kategori',
      render: (row) => (
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold border border-blue-100">
            {row.category || 'Umum'}
        </span>
      )
    },
    { 
      header: 'Pertanyaan', 
      render: (row) => (
         <div className="max-w-xs truncate" title={stripHtml(row.question_text)}>
            {stripHtml(row.question_text)}
         </div>
      ) 
    },
    { header: 'Poin', accessor: 'point' },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex space-x-2">
          <Button 
            size="sm" variant="ghost" icon={Eye} 
            onClick={() => { setEditingQuestion(row); setIsPreviewOpen(true); }}
          />
          <Button 
            size="sm" variant="ghost" icon={Edit} 
            onClick={() => handleOpenModal(row)}
          >
            Edit
          </Button>
          <Button 
            size="sm" variant="ghost" icon={Trash2} 
            onClick={() => handleDelete(row)} 
            className="text-red-600 hover:bg-red-50"
          >
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/question-maker/packages')}>
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{packageData?.name || '...'}</h1>
            <p className="text-sm text-gray-600">Kelola butir soal untuk paket ini</p>
          </div>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Buat Soal Baru</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={questions} loading={isLoading} emptyMessage="Belum ada soal." />
      </div>

      {/* MODAL PREVIEW */}
      <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title="Preview Soal" size="lg">
        {editingQuestion && (
           <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                      {editingQuestion.category || 'Umum'}
                  </span>
                  <span className="text-xs text-gray-500">Poin: {editingQuestion.point}</span>
              </div>
              <div className="p-4 bg-gray-50 rounded border prose max-w-none ql-editor" dangerouslySetInnerHTML={{ __html: editingQuestion.question_text }} />
              <div className="grid gap-2">
                 {(editingQuestion.answer_options || editingQuestion.options || []).map((opt, idx) => (
                    <div key={idx} className={`p-2 border rounded flex ${opt.is_correct ? 'bg-green-50 border-green-300' : 'bg-white'}`}>
                        <span className="font-bold mr-2">{opt.label || String.fromCharCode(65+idx)}.</span>
                        <div dangerouslySetInnerHTML={{ __html: opt.option_text || opt.text }} />
                    </div>
                 ))}
              </div>
              <div className="flex justify-end"><Button onClick={() => setIsPreviewOpen(false)}>Tutup</Button></div>
           </div>
        )}
      </Modal>

      {/* MODAL FORM */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingQuestion ? 'Edit Soal' : 'Buat Soal Baru'}
        size="2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
            {/* [BARU] Dropdown Kategori Soal menggunakan React Hook Form */}
            <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select 
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    {...register('category', { required: true })}
                >
                    <option value="General">Umum</option>
                    <option value="TWK">TWK</option>
                    <option value="TIU">TIU</option>
                    <option value="TKP">TKP</option>
                </select>
            </div>

            <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Soal</label>
                <select 
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    {...register('type')}
                >
                    <option value="single">Pilihan Ganda</option>
                    <option value="multiple">Kompleks</option>
                    <option value="weighted">Bobot (TKD)</option>
                    <option value="short">Isian Singkat</option>
                </select>
            </div>
            <div className="md:col-span-1">
                <Input 
                    label="Poin" 
                    type="number" 
                    {...register('point', { valueAsNumber: true })} 
                />
            </div>
            <div className="md:col-span-1">
                <Input 
                    label="Durasi (s)" 
                    type="number" 
                    {...register('duration_seconds', { valueAsNumber: true })} 
                />
            </div>
          </div>

          {/* Editor Pertanyaan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teks Pertanyaan</label>
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
                            formats={formats}
                            className="h-56"
                            placeholder="Tulis pertanyaan, rumus matematika, atau gambar..."
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
                    <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        icon={ListPlus}
                        onClick={() => append({ label: '', text: '', is_correct: false, weight: 0 })}
                    >
                        Tambah Opsi
                    </Button>
                )}
            </div>

            {watchedType === 'short' && (
                <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-800 mb-2">Masukkan satu kata atau angka pasti sebagai kunci jawaban.</p>
                    <Input 
                        placeholder="Contoh: 1945 atau Soekarno"
                        {...register('short_answer_key', { required: watchedType === 'short' })}
                    />
                </div>
            )}

            {watchedType !== 'short' && (
                <div className="space-y-3">
                    {fields.map((item, index) => (
                        <div key={item.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-colors">
                            
                            <div className="flex flex-col items-center gap-2 pt-2">
                                <span className="font-bold text-gray-500 w-6 text-center">{String.fromCharCode(65 + index)}</span>
                                
                                {watchedType === 'single' && (
                                    <input 
                                        type="radio" 
                                        className="w-5 h-5 text-blue-600 cursor-pointer"
                                        checked={watchedOptions?.[index]?.is_correct === true}
                                        onChange={() => handleSingleCorrectChange(index)}
                                        title="Tandai sebagai jawaban benar"
                                    />
                                )}
                                
                                {watchedType === 'multiple' && (
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                                        {...register(`options.${index}.is_correct`)}
                                        title="Centang jika ini jawaban benar"
                                    />
                                )}
                            </div>

                            <div className="flex-1 space-y-2">
                                {/* Editor Opsi Jawaban */}
                                <div className="bg-white">
                                    <Controller
                                        name={`options.${index}.text`}
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <ReactQuill
                                                theme="snow"
                                                value={field.value || ''}
                                                onChange={field.onChange}
                                                modules={simpleModules}
                                                className="h-auto"
                                                placeholder={`Teks opsi ${String.fromCharCode(65 + index)}`}
                                            />
                                        )}
                                    />
                                </div>
                                
                                {watchedType === 'weighted' && (
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-medium text-gray-600">Bobot Nilai:</label>
                                        <input 
                                            type="number" 
                                            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                                            placeholder="0"
                                            {...register(`options.${index}.weight`, { valueAsNumber: true })}
                                        />
                                    </div>
                                )}
                            </div>

                            <button 
                                type="button"
                                onClick={() => remove(index)}
                                className="text-gray-400 hover:text-red-500 p-1"
                                disabled={fields.length <= 2}
                                title="Hapus opsi ini"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
          </div>

          {/* Editor Pembahasan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pembahasan / Penjelasan</label>
            <div className="h-48 mb-8">
                <Controller
                    name="explanation"
                    control={control}
                    render={({ field }) => (
                        <ReactQuill 
                            theme="snow"
                            value={field.value || ''}
                            onChange={field.onChange}
                            modules={mainModules}
                            formats={formats}
                            className="h-40"
                            placeholder="Jelaskan kenapa jawaban tersebut benar..."
                        />
                    )}
                />
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200">
             <p className="font-bold mb-1">Panduan Rumus (LaTeX):</p>
             <ul className="grid grid-cols-2 gap-x-4 gap-y-1 list-disc pl-4">
               <li>Pecahan: <code className="bg-gray-200 px-1 rounded">{"\\frac{a}{b}"}</code></li>
               <li>Pangkat: <code className="bg-gray-200 px-1 rounded">{"x^2"}</code></li>
               <li>Akar: <code className="bg-gray-200 px-1 rounded">{"\\sqrt{x}"}</code></li>
               <li>Integral: <code className="bg-gray-200 px-1 rounded">{"\\int"}</code></li>
             </ul>
             <p className="mt-1 italic">Klik tombol <b>fx</b> pada toolbar untuk rumus. Klik tombol <b>Gambar</b> untuk upload.</p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {editingQuestion ? 'Simpan Perubahan' : 'Buat Soal'}
            </Button>
          </div>

        </form>
      </Modal>
    </div>
  );
}