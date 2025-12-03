'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Plus,
  Pill,
  Edit,
  Trash2,
  Search,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

const categoryLabels: Record<string, string> = {
  protein: '단백질',
  omega3: '오메가3',
  creatine: '크레아틴',
  bcaa: 'BCAA',
  vitamin: '비타민',
  preworkout: '프리워크아웃',
  other: '기타'
}

const categoryColors: Record<string, string> = {
  protein: 'bg-blue-100 text-blue-800',
  omega3: 'bg-green-100 text-green-800',
  creatine: 'bg-purple-100 text-purple-800',
  bcaa: 'bg-yellow-100 text-yellow-800',
  vitamin: 'bg-orange-100 text-orange-800',
  preworkout: 'bg-red-100 text-red-800',
  other: 'bg-gray-100 text-gray-800'
}

export default function SupplementListPage() {
  const router = useRouter()
  const [supplements, setSupplements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    fetchSupplements()
  }, [])

  const fetchSupplements = async () => {
    try {
      const res = await fetch('/api/supplements')
      if (res.ok) {
        const data = await res.json()
        setSupplements(data)
      }
    } catch (error) {
      console.error('Error fetching supplements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 보조제를 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/supplements/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchSupplements()
      } else {
        alert('삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('Error deleting supplement:', error)
      alert('삭제 중 오류가 발생했습니다')
    }
  }

  const filteredSupplements = supplements.filter((sup) => {
    const matchesSearch =
      sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sup.brand && sup.brand.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory =
      filterCategory === 'all' || sup.category === filterCategory

    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/supplements">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">보조제 목록</h1>
            <p className="text-muted-foreground">
              등록된 보조제를 관리하고 수정하세요
            </p>
          </div>
        </div>
        <Link href="/dashboard/supplements/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            보조제 추가
          </Button>
        </Link>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="보조제 이름 또는 브랜드 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory('all')}
              >
                전체
              </Button>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <Button
                  key={key}
                  variant={filterCategory === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 보조제 그리드 */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : filteredSupplements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Pill className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterCategory !== 'all'
                ? '검색 결과가 없습니다'
                : '등록된 보조제가 없습니다'}
            </p>
            <Link href="/dashboard/supplements/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                첫 보조제 추가하기
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSupplements.map((supplement) => (
            <Card key={supplement.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {supplement.imageUrl ? (
                      <img
                        src={supplement.imageUrl}
                        alt={supplement.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Pill className="w-8 h-8 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2">
                        {supplement.name}
                      </CardTitle>
                      {supplement.brand && (
                        <CardDescription className="text-sm">
                          {supplement.brand}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Badge className={categoryColors[supplement.category]}>
                    {categoryLabels[supplement.category]}
                  </Badge>
                </div>

                {supplement.dosage && (
                  <div className="text-sm">
                    <span className="font-medium">복용량:</span> {supplement.dosage}
                  </div>
                )}

                {supplement.timing && (
                  <div className="text-sm">
                    <span className="font-medium">시점:</span> {supplement.timing}
                  </div>
                )}

                {supplement.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {supplement.description}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Link href={`/dashboard/supplements/${supplement.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="mr-2 h-4 w-4" />
                      수정
                    </Button>
                  </Link>
                  {supplement.productUrl && (
                    <a
                      href={supplement.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(supplement.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
