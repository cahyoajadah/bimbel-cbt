import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ArrowLeft, X, ListPlus } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Button } from '../../components/common/Button';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm, useFieldArray } from 'react-hook-form'; 
import { useUIStore } from '../../store/uiStore';
import toast from 'react-hot-toast';

export default function Questions() {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

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

  const questions = questionsData?.questions || [];

  const { 
    register, control, handleSubmit, reset, watch, setValue, formState: { errors } 
  } = useForm({
    defaultValues: {
      type: 'single',
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
      const res = await api.delete(API_ENDPOINTS.QUESTION_DETAIL(packageId, id));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['questions', packageId]);
      toast.success('Soal berhasil dihapus');
    },
  });

  const handleOpenModal = (question = null) => {
    if (question) {
      setEditingQuestion(question);
      
      let formattedOptions = [];
      let shortAnswerKey = '';

      if (question.type === 'short') {
        const correctOpt = question.options?.find(o => o.is_correct);
        shortAnswerKey = correctOpt ? correctOpt.text : '';
      } else {
        formattedOptions = question.options?.map(opt => ({
          id: opt.id,
          label: opt.label,
          text: opt.text,
          is_correct: Boolean(opt.is_correct),
          weight: opt.weight || 0
        })) || [];
      }

      reset({
        type: question.type || 'single',
        question_text: question.question_text,
        duration_seconds: question.duration_seconds,
        point: question.point,
        explanation: question.discussion || '', // Gunakan 'discussion' dari mapping backend
        options: formattedOptions,
        short_answer_key: shortAnswerKey 
      });
    } else {
      setEditingQuestion(null);
      reset({
        type: 'single',
        duration_seconds: 60,
        point: 5,
        explanation: '',
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
    showConfirm({
      title: 'Hapus Soal',
      message: `Hapus soal no. ${question.order_number}?`,
      type: 'danger',
      confirmText: 'Hapus',
      onConfirm: () => deleteMutation.mutate(question.id),
    });
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
    { 
      header: 'Pertanyaan', 
      render: (row) => <div className="max-w-xs truncate">{row.question_text}</div> 
    },
    { header: 'Poin', accessor: 'point' },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex space-x-2">
          {/* TOMBOL EDIT (DENGAN TEKS) */}
          <Button 
            size="sm" 
            variant="ghost" 
            icon={Edit} 
            onClick={() => handleOpenModal(row)}
          >
            Edit
          </Button>
          
          {/* TOMBOL HAPUS (DENGAN TEKS) */}
          <Button 
            size="sm" 
            variant="ghost" 
            icon={Trash2} 
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
        <Table columns={columns} data={questions} loading={isLoading} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingQuestion ? 'Edit Soal' : 'Buat Soal Baru'}
        size="2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Soal</label>
                <select 
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    {...register('type')}
                >
                    <option value="single">Pilihan Ganda (Standar)</option>
                    <option value="multiple">Pilihan Ganda Kompleks</option>
                    <option value="weighted">Bobot Nilai (TKD/CPNS)</option>
                    <option value="short">Isian Singkat</option>
                </select>
            </div>
            <Input 
                label="Poin Maksimal" 
                type="number" 
                {...register('point', { valueAsNumber: true })} 
            />
            <Input 
                label="Durasi (detik)" 
                type="number" 
                {...register('duration_seconds', { valueAsNumber: true })} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teks Pertanyaan</label>
            <textarea
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tulis pertanyaan di sini..."
              {...register('question_text', { required: 'Pertanyaan wajib diisi' })}
            />
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
                                <textarea
                                    rows={2}
                                    className="block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                    placeholder={`Teks opsi ${String.fromCharCode(65 + index)}`}
                                    {...register(`options.${index}.text`, { required: true })}
                                />
                                
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pembahasan / Penjelasan</label>
            <textarea
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Jelaskan kenapa jawaban tersebut benar..."
              {...register('explanation')}
            />
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