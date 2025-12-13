import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ArrowLeft, X, ListPlus, Eye, Save } from 'lucide-react';
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

// Bind Katex ke window agar Quill bisa mendeteksinya
window.katex = katex; 

export default function Questions() {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Ref untuk instance Quill
  const quillRef = useRef(null); 

  // --- KONFIGURASI QUILL EDITOR ---
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

  // --- FETCH DATA ---
  const { data: packageData } = useQuery({
    queryKey: ['question-package', packageId],
    queryFn: async () => {
      const res = await api.get(`${API_ENDPOINTS.QUESTION_PACKAGES}/${packageId}`);
      return res.data.data;
    },
  });

  const categories = packageData?.categories || [];

  const { data: questionsData, isLoading } = useQuery({
    queryKey: ['questions', packageId],
    queryFn: async () => {
      const url = API_ENDPOINTS.QUESTIONS ? API_ENDPOINTS.QUESTIONS(packageId) : `/question-maker/packages/${packageId}/questions`;
      const res = await api.get(url);
      return res.data.data;
    },
  });

  const questions = Array.isArray(questionsData) ? questionsData : (questionsData?.questions || []);

  // Hitung nomor urut fleksibel (displayIndex)
  const processedQuestions = useMemo(() => {
    return questions.map((q, index) => ({
      ...q,
      displayIndex: index + 1
    }));
  }, [questions]);

  // --- FORM HANDLING ---
  const { 
    register, control, handleSubmit, reset, watch, setValue, formState: { errors } 
  } = useForm({
    defaultValues: {
      type: 'single', 
      question_category_id: '',
      question_text: '',
      point: 5,
      explanation: '',
      options: [
        { option_text: '', is_correct: false, weight: 0 },
        { option_text: '', is_correct: false, weight: 0 },
        { option_text: '', is_correct: false, weight: 0 },
        { option_text: '', is_correct: false, weight: 0 },
        { option_text: '', is_correct: false, weight: 0 },
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

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: (data) => api.post(`/question-maker/packages/${packageId}/questions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['questions', packageId]);
      setIsModalOpen(false);
      reset();
      toast.success('Soal berhasil ditambahkan');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal tambah soal'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/question-maker/packages/${packageId}/questions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['questions', packageId]);
      setIsModalOpen(false);
      setEditingQuestion(null);
      reset();
      toast.success('Soal berhasil diperbarui');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal update soal'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/question-maker/packages/${packageId}/questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['questions', packageId]);
      toast.success('Soal dihapus');
    },
  });

  // --- HANDLERS ---
  const handleOpenModal = (question = null) => {
    setEditingQuestion(question);
    if (question) {
      setValue('type', question.type);
      setValue('question_category_id', question.question_category_id || (question.category?.id) || '');
      setValue('question_text', question.question_text);
      setValue('point', question.point);
      setValue('explanation', question.explanation || '');

      const rawOptions = question.answer_options || question.options || [];
      const formattedOptions = rawOptions.map(opt => ({
        id: opt.id,
        option_text: opt.option_text || opt.text || '',
        is_correct: Boolean(opt.is_correct),
        weight: parseInt(opt.weight || 0)
      }));
      
      setValue('options', formattedOptions);

      if (question.type === 'short') {
         const correctOpt = formattedOptions.find(o => o.is_correct);
         setValue('short_answer_key', correctOpt ? correctOpt.option_text : '');
      }

    } else {
      reset({
        type: 'single', 
        question_category_id: '',
        question_text: '',
        point: 5,
        explanation: '',
        short_answer_key: '',
        options: Array(5).fill({ option_text: '', is_correct: false, weight: 0 })
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data) => {
    if (data.type === 'single') {
       const correctCount = data.options.filter(opt => opt.is_correct).length;
       if (correctCount !== 1) return toast.error('Pilihan Ganda harus memiliki tepat 1 jawaban benar!');
    }
    
    if (data.type === 'multiple') {
       const hasCorrect = data.options.some(opt => opt.is_correct);
       if (!hasCorrect) return toast.error('Pilihan Ganda Kompleks minimal harus ada 1 jawaban benar!');
    }

    if (data.type === 'weighted') {
        const hasWeight = data.options.some(opt => opt.weight > 0);
        if (!hasWeight) return toast.error('Minimal satu opsi harus memiliki bobot nilai > 0');
    }

    const payload = { ...data };
    
    if (payload.type === 'short') {
        payload.options = [{
          option_text: data.short_answer_key, 
          is_correct: true,
          weight: 0
        }];
    } 

    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id) => {
    showConfirm({
      title: 'Hapus Soal',
      message: 'Yakin hapus soal ini?',
      type: 'danger',
      onConfirm: () => deleteMutation.mutate(id),
    });
  };

  const stripHtml = (html) => {
     if(!html) return "";
     const tmp = document.createElement("DIV");
     tmp.innerHTML = html;
     return tmp.textContent || tmp.innerText || "";
  };

  // --- TABEL COLUMNS ---
  const columns = [
    { 
        header: 'No.', 
        accessor: 'displayIndex',
        className: 'w-16 text-center font-bold'
    },
    { 
      header: 'Tipe', 
      render: (row) => {
        return <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium capitalize">
            {row.type === 'single' ? 'Pilihan Ganda' : 
             row.type === 'multiple' ? 'Kompleks' : 
             row.type === 'weighted' ? 'Bobot' : 
             'Isian'}
        </span>;
      }
    },
    {
      header: 'Kategori',
      render: (row) => (
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold border border-blue-100">
            {row.category_name || row.category?.name || 'Umum'}
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
          />
          <Button 
            size="sm" variant="ghost" icon={Trash2} 
            className="text-red-600 hover:bg-red-50" 
            onClick={() => handleDelete(row.id)} 
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/question-maker/packages')}>
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{packageData?.name || '...'}</h1>
            <p className="text-sm text-gray-600">Kelola butir soal untuk paket ini</p>
          </div>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Tambah Soal</Button>
      </div>

      {/* LIST SOAL (MOBILE VIEW ONLY) */}
      {/* [FIX] Tambahkan md:hidden agar tidak muncul ganda di desktop */}
      <div className="space-y-4 md:hidden">
        {processedQuestions?.length > 0 ? (
            processedQuestions.map((q, idx) => (
                <div key={q.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                                    No. {idx + 1}
                                </span>
                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded capitalize">
                                    {q.type === 'multiple' ? 'Pilihan Ganda' : q.type === 'weighted' ? 'Bobot' : 'Isian'}
                                </span>
                                {q.category_name || q.category?.name ? (
                                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-medium">
                                        {q.category_name || q.category?.name}
                                    </span>
                                ) : null}
                                <span className="text-xs text-gray-400">Poin: {q.point}</span>
                            </div>
                            <div 
                                className="text-gray-800 text-sm line-clamp-2 prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: q.question_text }}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                size="sm" variant="ghost" icon={Eye} 
                                onClick={() => { setEditingQuestion(q); setIsPreviewOpen(true); }}
                            />
                            <Button 
                                size="sm" variant="ghost" icon={Edit} 
                                onClick={() => handleOpenModal(q)} 
                            />
                            <Button 
                                size="sm" variant="ghost" icon={Trash2} 
                                className="text-red-600 hover:bg-red-50" 
                                onClick={() => handleDelete(q.id)} 
                            />
                        </div>
                    </div>
                </div>
            ))
        ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300 text-gray-500">
                Belum ada soal di paket ini.
            </div>
        )}
      </div>

      {/* TABLE VIEW (DESKTOP ONLY) */}
      <div className="hidden md:block bg-white rounded-lg shadow">
        <Table columns={columns} data={processedQuestions} loading={isLoading} emptyMessage="Belum ada soal." />
      </div>

      {/* MODAL PREVIEW */}
      <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title="Preview Soal" size="lg">
        {editingQuestion && (
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                        {editingQuestion.category?.name || editingQuestion.category_name || '-'}
                    </span>
                    <span className="text-xs text-gray-500">Poin: {editingQuestion.point}</span>
                </div>
                <div className="p-4 bg-gray-50 rounded border prose max-w-none ql-editor" dangerouslySetInnerHTML={{ __html: editingQuestion.question_text }} />
                
                <div className="grid gap-2">
                    {(editingQuestion.answer_options || editingQuestion.options || []).map((opt, idx) => (
                    <div key={idx} className={`p-2 border rounded flex items-center ${opt.is_correct ? 'bg-green-50 border-green-300' : 'bg-white'}`}>
                        <span className="font-bold mr-2 w-6 text-center">{String.fromCharCode(65+idx)}.</span>
                        <div className="flex-1" dangerouslySetInnerHTML={{ __html: opt.option_text || opt.text }} />
                        {opt.weight > 0 && <span className="text-xs bg-gray-200 px-2 py-1 rounded ml-2">Bobot: {opt.weight}</span>}
                    </div>
                    ))}
                </div>

                {editingQuestion.explanation && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded">
                        <p className="font-bold text-sm text-yellow-800 mb-1">Pembahasan:</p>
                        <div className="text-sm text-yellow-900 prose max-w-none" dangerouslySetInnerHTML={{ __html: editingQuestion.explanation }} />
                    </div>
                )}
                
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                
                {/* 1. Tipe Soal */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Tipe Soal</label>
                    <select className="w-full border border-gray-300 rounded-lg p-2" {...register('type')}>
                        <option value="single">Pilihan Ganda (Satu Jawaban)</option>
                        <option value="multiple">Pilihan Ganda Kompleks (Banyak Jawaban)</option>
                        <option value="weighted">Pilihan Ganda Bobot (TKD)</option>
                        <option value="short">Isian Singkat</option>
                    </select>
                </div>

                {/* 2. Kategori */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Kategori <span className="text-red-500">*</span></label>
                    <select 
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        {...register('question_category_id', { required: 'Kategori wajib dipilih' })}
                    >
                        <option value="">-- Pilih Kategori --</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name} (PG: {cat.passing_grade})
                            </option>
                        ))}
                    </select>
                    {errors.question_category_id && <p className="text-red-500 text-xs mt-1">{errors.question_category_id.message}</p>}
                    {categories.length === 0 && (
                        <p className="text-xs text-orange-600 mt-1 font-medium">
                            ⚠ Belum ada kategori.
                        </p>
                    )}
                </div>

                {/* 3. Poin */}
                <div>
                    <Input label="Poin (Bobot Maksimal)" type="number" {...register('point', { min: 1 })} className="bg-white" />
                </div>
            </div>

            {/* Editor Soal */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pertanyaan</label>
                <div className="h-64 mb-10">
                    <Controller
                        name="question_text"
                        control={control}
                        rules={{ required: 'Pertanyaan wajib diisi' }}
                        render={({ field }) => (
                            <ReactQuill 
                                theme="snow"
                                ref={quillRef} 
                                value={field.value || ''} 
                                onChange={field.onChange} 
                                modules={mainModules}
                                formats={formats}
                                className="h-48"
                                placeholder="Tulis pertanyaan..."
                            />
                        )}
                    />
                </div>
                {errors.question_text && <p className="text-red-500 text-xs mt-1">{errors.question_text.message}</p>}
            </div>

            {/* Opsi Jawaban */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-gray-700">
                        {watchedType === 'short' ? 'Kunci Jawaban' : 'Opsi Jawaban'}
                    </h4>
                    {watchedType !== 'short' && (
                        <Button type="button" size="sm" variant="outline" onClick={() => append({ option_text: '', is_correct: false, weight: 0 })} icon={ListPlus}>
                            Tambah Opsi
                        </Button>
                    )}
                </div>
                
                {watchedType === 'short' ? (
                    <div className="p-3 bg-blue-50 rounded text-sm text-blue-700 border border-blue-100">
                        <p className="mb-2 font-medium">Masukkan jawaban pasti (Sistem akan mencocokkan teks):</p>
                        <Input placeholder="Contoh: Soekarno" {...register('short_answer_key', { required: true })} className="bg-white" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-start bg-white p-2 rounded border border-gray-200 shadow-sm">
                                <div className="flex flex-col items-center gap-2 pt-2">
                                    <span className="font-bold text-gray-500 w-6 text-center bg-gray-100 rounded text-xs py-1">
                                        {String.fromCharCode(65 + index)}
                                    </span>
                                    
                                    {/* LOGIKA INPUT KUNCI JAWABAN */}
                                    
                                    {/* 1. SINGLE: Radio Button */}
                                    {watchedType === 'single' && (
                                        <input 
                                            type="radio" 
                                            className="w-5 h-5 text-blue-600 cursor-pointer mt-1"
                                            checked={watchedOptions?.[index]?.is_correct === true}
                                            onChange={() => handleSingleCorrectChange(index)}
                                            title="Tandai sebagai jawaban benar"
                                        />
                                    )}

                                    {/* 2. MULTIPLE: Checkbox */}
                                    {watchedType === 'multiple' && (
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 text-blue-600 cursor-pointer mt-1 rounded"
                                            {...register(`options.${index}.is_correct`)}
                                            title="Tandai sebagai salah satu jawaban benar"
                                        />
                                    )}

                                    {/* 3. WEIGHTED: Bobot via input number di kanan */}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <Controller
                                        name={`options.${index}.option_text`}
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <ReactQuill
                                                theme="snow"
                                                value={field.value || ''}
                                                onChange={field.onChange}
                                                modules={simpleModules}
                                                className="bg-white"
                                                placeholder={`Teks opsi ${String.fromCharCode(65 + index)}`}
                                            />
                                        )}
                                    />
                                </div>

                                {watchedType === 'weighted' && (
                                    <div className="w-20 pt-1">
                                        <label className="text-[10px] font-bold text-gray-500 block mb-1">BOBOT</label>
                                        <input 
                                            type="number" 
                                            className="w-full border rounded p-1 text-sm text-center"
                                            placeholder="0"
                                            {...register(`options.${index}.weight`, { valueAsNumber: true })}
                                        />
                                    </div>
                                )}

                                <button type="button" onClick={() => remove(index)} className="text-gray-400 hover:text-red-500 p-1 pt-3">
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Editor Pembahasan */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pembahasan (Opsional)</label>
                <div className="h-40 mb-10">
                    <Controller
                        name="explanation"
                        control={control}
                        render={({ field }) => (
                            <ReactQuill 
                                theme="snow"
                                value={field.value || ''} 
                                onChange={field.onChange} 
                                modules={mainModules}
                                className="h-32"
                                placeholder="Jelaskan jawaban yang benar..."
                            />
                        )}
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t gap-2 bg-white sticky bottom-0">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" loading={createMutation.isPending || updateMutation.isPending} icon={Save}>
                    Simpan Soal
                </Button>
            </div>
        </form>
      </Modal>
    </div>
  );
}