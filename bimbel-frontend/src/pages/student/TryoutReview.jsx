// src/pages/student/TryoutReview.jsx
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Award } from 'lucide-react';
import { Button } from '../../components/common/Button';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import clsx from 'clsx';

export default function TryoutReview() {
  const { resultId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['tryout-review', resultId],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.TRYOUT_REVIEW(resultId));
      return res.data.data;
    },
  });

  if (isLoading) {
    return <LoadingSpinner text="Memuat hasil tryout..." />;
  }

  const result = data?.result || {};
  const review = data?.review || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          icon={ArrowLeft}
          onClick={() => navigate('/student/tryouts')}
        >
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Review Tryout</h1>
      </div>

      {/* Score Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Hasil Tryout Anda</h2>
            <p className="text-blue-100">
              {result.question_package?.name || 'Tryout'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold mb-2">{result.total_score || 0}</div>
            <div className="text-blue-100">
              dari {result.total_questions * 5} poin
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-8 pt-8 border-t border-blue-500">
          <div>
            <div className="text-3xl font-bold">{result.total_questions || 0}</div>
            <div className="text-sm text-blue-100">Total Soal</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-300">{result.correct_answers || 0}</div>
            <div className="text-sm text-blue-100">Benar</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-red-300">{result.wrong_answers || 0}</div>
            <div className="text-sm text-blue-100">Salah</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{Math.round(result.percentage || 0)}%</div>
            <div className="text-sm text-blue-100">Persentase</div>
          </div>
        </div>

        {result.is_passed !== undefined && (
          <div className={clsx(
            'mt-6 px-4 py-2 rounded-lg inline-flex items-center',
            result.is_passed ? 'bg-green-500' : 'bg-red-500'
          )}>
            <Award className="w-5 h-5 mr-2" />
            <span className="font-medium">
              {result.is_passed ? 'LULUS' : 'TIDAK LULUS'}
            </span>
          </div>
        )}
      </div>

      {/* Questions Review */}
      <div className="space-y-4">
        {review.map((item, index) => (
          <div
            key={index}
            className={clsx(
              'bg-white rounded-lg shadow p-6 border-l-4',
              item.is_correct ? 'border-green-500' : 'border-red-500'
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Soal No. {item.question_number}
              </h3>
              <div className={clsx(
                'flex items-center px-3 py-1 rounded-full text-sm font-medium',
                item.is_correct
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              )}>
                {item.is_correct ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Benar
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    Salah
                  </>
                )}
              </div>
            </div>

            <div className="prose max-w-none mb-4">
              <p className="text-gray-800">{item.question_text}</p>
              {item.question_image && (
                <img
                  src={item.question_image}
                  alt="Soal"
                  className="mt-2 max-w-full rounded"
                />
              )}
            </div>

            {/* Options */}
            <div className="space-y-2 mb-4">
              {item.options?.map((option) => (
                <div
                  key={option.label}
                  className={clsx(
                    'p-3 rounded-lg border-2',
                    option.is_correct && 'bg-green-50 border-green-500',
                    option.label === item.your_answer && !option.is_correct && 'bg-red-50 border-red-500',
                    !option.is_correct && option.label !== item.your_answer && 'border-gray-200'
                  )}
                >
                  <div className="flex items-start">
                    <div className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0',
                      option.is_correct && 'bg-green-500 text-white',
                      option.label === item.your_answer && !option.is_correct && 'bg-red-500 text-white',
                      !option.is_correct && option.label !== item.your_answer && 'bg-gray-200 text-gray-700'
                    )}>
                      {option.label}
                    </div>
                    <p className="text-gray-800 flex-1">{option.text}</p>
                    {option.is_correct && (
                      <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
                    )}
                    {option.label === item.your_answer && !option.is_correct && (
                      <XCircle className="w-5 h-5 text-red-600 ml-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="font-medium text-gray-900">Jawaban Anda:</span>
                <span className={clsx(
                  'ml-2 px-2 py-1 rounded text-sm font-medium',
                  item.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                )}>
                  {item.your_answer || 'Tidak dijawab'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-900">Jawaban Benar:</span>
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                  {item.correct_answer}
                </span>
              </div>
            </div>

            {/* Explanation */}
            {item.explanation && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Pembahasan:</h4>
                <p className="text-blue-800 whitespace-pre-wrap">{item.explanation}</p>
                {item.explanation_image && (
                  <img
                    src={item.explanation_image}
                    alt="Pembahasan"
                    className="mt-2 max-w-full rounded"
                  />
                )}
              </div>
            )}

            <div className="mt-4 text-sm text-gray-600">
              Poin: <span className="font-medium">{item.is_correct ? item.point_earned : 0}</span> / {item.point_earned || 5}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
