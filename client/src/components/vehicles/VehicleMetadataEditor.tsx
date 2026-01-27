import { useState, useEffect } from 'react'
import type { Vehicle, VehicleMetadata } from '@/types'

interface VehicleMetadataEditorProps {
  vehicle: Vehicle
  onClose: () => void
  onSave: () => void
}

const categoryOptions = [
  { value: 'economy', label: 'Эконом' },
  { value: 'standard', label: 'Стандарт' },
  { value: 'premium', label: 'Премиум' },
  { value: 'luxury', label: 'Люкс' },
  { value: 'suv', label: 'Внедорожники' },
  { value: 'minivan', label: 'Минивэны' },
  { value: 'electric', label: 'Электро' },
  { value: 'motorcycle', label: 'Мотоциклы' },
]

const transmissionOptions = [
  { value: 'automatic', label: 'Автомат' },
  { value: 'manual', label: 'Механика' },
  { value: 'cvt', label: 'Вариатор' },
]

const defaultFeatures = [
  'Кондиционер',
  'GPS-навигация',
  'Камера заднего вида',
  'Bluetooth',
  'USB-порт',
  'Круиз-контроль',
  'Подогрев сидений',
  'Парктроник',
  'Sunroof',
  'Apple CarPlay',
  'Android Auto',
]

export default function VehicleMetadataEditor({
  vehicle,
  onClose,
  onSave,
}: VehicleMetadataEditorProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [metadata, setMetadata] = useState<Partial<VehicleMetadata>>({
    websiteId: '',
    category: 'economy',
    images: [],
    features: [],
    specifications: {},
    seats: 5,
    luggage: 2,
    rating: 4.5,
    reviews: 0,
    description: null,
    transmission: 'automatic',
    isVisible: false,
    displayOrder: 0,
    priceByRequest: false,
    longTermOnly: false,
  })

  const [newImageUrl, setNewImageUrl] = useState('')
  const [newFeature, setNewFeature] = useState('')

  useEffect(() => {
    fetchMetadata()
  }, [vehicle.id])

  const fetchMetadata = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/vehicles/${vehicle.id}/metadata`)
      if (response.ok) {
        const data = await response.json()
        setMetadata(data)
      }
    } catch (err) {
      console.error('Failed to fetch metadata:', err)
      setError('Ошибка загрузки данных')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`/api/vehicles/${vehicle.id}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Ошибка сохранения')
      }

      onSave()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setIsSaving(false)
    }
  }

  const addImage = () => {
    if (newImageUrl.trim()) {
      setMetadata({
        ...metadata,
        images: [...(metadata.images || []), newImageUrl.trim()],
      })
      setNewImageUrl('')
    }
  }

  const removeImage = (index: number) => {
    setMetadata({
      ...metadata,
      images: (metadata.images || []).filter((_, i) => i !== index),
    })
  }

  const toggleFeature = (feature: string) => {
    const features = metadata.features || []
    if (features.includes(feature)) {
      setMetadata({
        ...metadata,
        features: features.filter((f) => f !== feature),
      })
    } else {
      setMetadata({
        ...metadata,
        features: [...features, feature],
      })
    }
  }

  const addCustomFeature = () => {
    if (newFeature.trim() && !(metadata.features || []).includes(newFeature.trim())) {
      setMetadata({
        ...metadata,
        features: [...(metadata.features || []), newFeature.trim()],
      })
      setNewFeature('')
    }
  }

  const updateSpecification = (key: string, value: string) => {
    setMetadata({
      ...metadata,
      specifications: {
        ...metadata.specifications,
        [key]: value || undefined,
      },
    })
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="modal-overlay" onClick={onClose} />
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="modal-content relative z-10 w-full max-w-3xl p-8">
            <div className="flex items-center justify-center">
              <div className="spinner w-10 h-10 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="modal-overlay" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="modal-content relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                <GlobeIcon className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Настройки для сайта
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <CloseIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Показывать на сайте
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Когда включено, авто будет отображаться в каталоге
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={metadata.isVisible ?? false}
                  onChange={(e) => setMetadata({ ...metadata, isVisible: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Basic Info */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon">
                  <InfoIcon className="w-full h-full" />
                </span>
                Основные настройки
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Website ID</label>
                  <input
                    type="text"
                    value={metadata.websiteId || ''}
                    onChange={(e) => setMetadata({ ...metadata, websiteId: e.target.value })}
                    className="input-enhanced font-mono text-sm"
                    placeholder="Авто-генерируется"
                  />
                  <p className="text-xs text-gray-500 mt-1">Уникальный ID для URL</p>
                </div>
                <div>
                  <label className="form-label">Категория</label>
                  <select
                    value={metadata.category || 'economy'}
                    onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
                    className="input-enhanced"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Трансмиссия</label>
                  <select
                    value={metadata.transmission || 'automatic'}
                    onChange={(e) => setMetadata({ ...metadata, transmission: e.target.value })}
                    className="input-enhanced"
                  >
                    {transmissionOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Порядок сортировки</label>
                  <input
                    type="number"
                    value={metadata.displayOrder || 0}
                    onChange={(e) =>
                      setMetadata({ ...metadata, displayOrder: parseInt(e.target.value) || 0 })
                    }
                    className="input-enhanced"
                  />
                </div>
              </div>
            </div>

            {/* Capacity */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon">
                  <UsersIcon className="w-full h-full" />
                </span>
                Вместимость
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Количество мест</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={metadata.seats || 5}
                    onChange={(e) =>
                      setMetadata({ ...metadata, seats: parseInt(e.target.value) || 5 })
                    }
                    className="input-enhanced"
                  />
                </div>
                <div>
                  <label className="form-label">Багаж (чемоданов)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={metadata.luggage || 2}
                    onChange={(e) =>
                      setMetadata({ ...metadata, luggage: parseInt(e.target.value) || 2 })
                    }
                    className="input-enhanced"
                  />
                </div>
              </div>
            </div>

            {/* Price Options */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon">
                  <CurrencyIcon className="w-full h-full" />
                </span>
                Настройки цены
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={metadata.priceByRequest ?? false}
                    onChange={(e) =>
                      setMetadata({ ...metadata, priceByRequest: e.target.checked })
                    }
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 dark:bg-zinc-700 dark:border-zinc-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Цена по запросу</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={metadata.longTermOnly ?? false}
                    onChange={(e) =>
                      setMetadata({ ...metadata, longTermOnly: e.target.checked })
                    }
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 dark:bg-zinc-700 dark:border-zinc-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Только долгосрочная аренда (от месяца)
                  </span>
                </label>
              </div>
            </div>

            {/* Specifications */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon">
                  <GaugeIcon className="w-full h-full" />
                </span>
                Технические характеристики
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Двигатель</label>
                  <input
                    type="text"
                    value={metadata.specifications?.engine || ''}
                    onChange={(e) => updateSpecification('engine', e.target.value)}
                    className="input-enhanced"
                    placeholder="1.5L Turbo"
                  />
                </div>
                <div>
                  <label className="form-label">Мощность</label>
                  <input
                    type="text"
                    value={metadata.specifications?.power || ''}
                    onChange={(e) => updateSpecification('power', e.target.value)}
                    className="input-enhanced"
                    placeholder="180 л.с."
                  />
                </div>
                <div>
                  <label className="form-label">Разгон 0-100</label>
                  <input
                    type="text"
                    value={metadata.specifications?.acceleration || ''}
                    onChange={(e) => updateSpecification('acceleration', e.target.value)}
                    className="input-enhanced"
                    placeholder="8.5 сек"
                  />
                </div>
                <div>
                  <label className="form-label">Макс. скорость</label>
                  <input
                    type="text"
                    value={metadata.specifications?.topSpeed || ''}
                    onChange={(e) => updateSpecification('topSpeed', e.target.value)}
                    className="input-enhanced"
                    placeholder="220 км/ч"
                  />
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon">
                  <StarIcon className="w-full h-full" />
                </span>
                Рейтинг
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Рейтинг (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={metadata.rating || 4.5}
                    onChange={(e) =>
                      setMetadata({ ...metadata, rating: parseFloat(e.target.value) || 4.5 })
                    }
                    className="input-enhanced"
                  />
                </div>
                <div>
                  <label className="form-label">Количество отзывов</label>
                  <input
                    type="number"
                    min="0"
                    value={metadata.reviews || 0}
                    onChange={(e) =>
                      setMetadata({ ...metadata, reviews: parseInt(e.target.value) || 0 })
                    }
                    className="input-enhanced"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon">
                  <ImageIcon className="w-full h-full" />
                </span>
                Изображения
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                    className="input-enhanced flex-1"
                    placeholder="https://example.com/image.jpg"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    className="btn btn-secondary px-4"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
                {(metadata.images || []).length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {(metadata.images || []).map((url, index) => (
                      <div
                        key={index}
                        className="relative group rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800 aspect-video"
                      >
                        <img
                          src={url}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src =
                              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="gray" font-size="12">Ошибка</text></svg>'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <CloseIcon className="w-4 h-4" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/50 text-white text-xs">
                            Главное
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon">
                  <CheckIcon className="w-full h-full" />
                </span>
                Особенности
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {defaultFeatures.map((feature) => (
                    <button
                      key={feature}
                      type="button"
                      onClick={() => toggleFeature(feature)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        (metadata.features || []).includes(feature)
                          ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-500/30'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {feature}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addCustomFeature())
                    }
                    className="input-enhanced flex-1"
                    placeholder="Добавить свою особенность..."
                  />
                  <button
                    type="button"
                    onClick={addCustomFeature}
                    className="btn btn-secondary px-4"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
                {/* Show custom features (not in defaultFeatures) */}
                {(metadata.features || [])
                  .filter((f) => !defaultFeatures.includes(f))
                  .map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-500/30"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => toggleFeature(feature)}
                        className="ml-1 hover:text-primary-900 dark:hover:text-primary-100"
                      >
                        <CloseIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="form-label">Описание для сайта</label>
              <textarea
                value={metadata.description || ''}
                onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                rows={4}
                className="input-enhanced resize-none"
                placeholder="Подробное описание автомобиля для посетителей сайта..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 btn btn-secondary py-3">
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 btn btn-primary py-3"
            >
              {isSaving ? (
                <>
                  <div className="spinner w-5 h-5 mr-2" />
                  Сохранение...
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5 mr-2" />
                  Сохранить
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Icons
function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function GaugeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  )
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}
