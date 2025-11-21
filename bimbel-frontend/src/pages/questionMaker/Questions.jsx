// src/pages/questionMaker/Questions.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Button } from '../../components/common/Button';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
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

  // ... imports
// Tambahkan watch dan setValue dari useForm
const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      question_text: '',
      duration_seconds: 120,
      point: 5,
      explanation: '',
      options: [
        { label: 'A', text: '', is_correct: false },
        { label: 'B', text: '', is_correct: false },
        { label: 'C', text: '', is_correct: false },
        { label: 'D', text: '', is_correct: false },
        { label: 'E', text: '', is_correct: false },
      ],
    },
  });

// Tambahkan ini untuk memantau perubahan nilai options secara realtime
  const watchedOptions = watch('options');
  
  const handleCorrectOptionChange = (selectedIndex) => {
    // Ambil semua options saat ini
    const currentOptions = watchedOptions;
    
    // Update semua options: yang dipilih jadi true, sisanya false
    const updatedOptions = currentOptions.map((opt, index) => ({
        ...opt,
        is_correct: index === selectedIndex
    }));

    // Update nilai form secara manual
    setValue('options', updatedOptions);
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post(API_ENDPOINTS.QUESTIONS(packageId), data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['questions', packageId]);
      queryClient.invalidateQueries(['question-package', packageId]);
      setIsModalOpen(false);
      reset();
      toast.success('Soal berhasil dibuat');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.QUESTION_DETAIL(packageId, id), data);
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
      queryClient.invalidateQueries(['question-package', packageId]);
      toast.success('Soal berhasil dihapus');
    },
  });

  const handleOpenModal = (question = null) => {
    if (question) {
      setEditingQuestion(question);
      reset({
        question_text: question.question_text,
        duration_seconds: question.duration_seconds,
        point: question.point,
        explanation: question.explanation || '',
        options: question.answer_options?.map(opt => ({
          id: opt.id,
          label: opt.option_label,
          text: opt.option_text,
          is_correct: opt.is_correct,
        })) || [],
      });
    } else {
      setEditingQuestion(null);
      reset();
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data) => {
    // Validate: must have exactly 1 correct answer
    const correctCount = data.options.filter(opt => opt.is_correct).length;
    if (correctCount !== 1) {
      toast.error('Harus ada tepat 1 jawaban yang benar');
      return;
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
      message: `Apakah Anda yakin ingin menghapus soal no. ${question.order_number}?`,
      type: 'danger',
      confirmText: 'Hapus',
      onConfirm: () => deleteMutation.mutate(question.id),
    });
  };

  const columns = [
    {
      header: 'No.',
      accessor: 'order_number',
    },
    {
      header: 'Pertanyaan',
      render: (row) => (
        <div className="max-w-md truncate">{row.question_text}</div>
      ),
    },
    {
      header: 'Durasi',
      render: (row) => `${row.duration_seconds}s`,
    },
    {
      header: 'Poin',
      accessor: 'point',
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenModal(row)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={Trash2}
            onClick={() => handleDelete(row)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate('/question-maker/packages')}
          >
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {packageData?.name || 'Loading...'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Total Soal: {packageData?.total_questions || 0}
            </p>
          </div>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>
          Tambah Soal
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={questions} loading={isLoading} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingQuestion(null);
          reset();
        }}
        title={editingQuestion ? 'Edit Soal' : 'Tambah Soal Baru'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pertanyaan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              {...register('question_text', { required: 'Pertanyaan wajib diisi' })}
            />
            {errors.question_text && (
              <p className="mt-1 text-sm text-red-600">{errors.question_text.message}</p>
            )}
          </div>

          {/* ... bagian question_text tetap sama ... */}

<div className="grid grid-cols-2 gap-4">
    <Input
        label="Durasi (detik)"
        type="number"
        required
        // Tambahkan valueAsNumber agar dikirim sebagai integer, bukan string (Mencegah Error 422)
        {...register('duration_seconds', { required: true, valueAsNumber: true })}
    />
    <Input
        label="Poin"
        type="number"
        step="0.01"
        required
        // Tambahkan valueAsNumber agar dikirim sebagai angka (Mencegah Error 422)
        {...register('point', { required: true, valueAsNumber: true })}
      />
  </div>

  <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
          Opsi Jawaban <span className="text-red-500">*</span>
      </label>
      <div className="space-y-3">
          {/* Gunakan field yang di dalam useForm fields atau map manual index 0-4 */}
          {['A', 'B', 'C', 'D', 'E'].map((label, index) => (
              <div key={label} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center mt-2">
                      {/* PERBAIKAN LOGIC RADIO BUTTON */}
                      <input
                          type="radio"
                          name="correct_answer_group" // Grouping visual
                          className="w-4 h-4 cursor-pointer text-blue-600 focus:ring-blue-500"
                          // Cek apakah index ini yang 'is_correct' nya true
                          checked={watchedOptions?.[index]?.is_correct === true}
                          // Saat diklik, jalankan fungsi manual kita
                          onChange={() => handleCorrectOptionChange(index)}
                      />
                  </div>
                  <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                          Opsi {label}
                      </label>
                      <input
                          type="hidden"
                          value={label}
                          {...register(`options.${index}.label`)}
                      />
                      <textarea
                          rows={2}
                          className="block w-full rounded border border-gray-300 px-3 py-2"
                          placeholder={`Teks untuk opsi ${label}`}
                          {...register(`options.${index}.text`, { required: "Teks opsi wajib diisi" })}
                      />
                  </div>
              </div>
          ))}
      </div>
            <p className="mt-2 text-xs text-gray-500">
              * Pilih salah satu opsi sebagai jawaban yang benar
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pembahasan
            </label>
            <textarea
              rows={4}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Tulis pembahasan jawaban..."
              {...register('explanation')}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingQuestion(null);
                reset();
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingQuestion ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
