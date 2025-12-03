'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

const categories = [
  { value: 'protein', label: '단백질' },
  { value: 'omega3', label: '오메가3' },
  { value: 'creatine', label: '크레아틴' },
  { value: 'bcaa', label: 'BCAA' },
  { value: 'vitamin', label: '비타민/미네랄' },
  { value: 'preworkout', label: '프리워크아웃' },
  { value: 'other', label: '기타' },
]

export default function NewSupplementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    dosage: '',
    timing: '',
    description: '',
    productUrl: '',
    imageUrl: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/supplements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push('/dashboard/supplements')
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.error || '보조제 추가에 실패했습니다')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('보조제 추가 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/supplements">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">보조제 추가</h1>
          <p className="text-muted-foreground">
            회원들에게 추천할 새로운 보조제를 등록하세요
          </p>
        </div>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>보조제 정보</CardTitle>
            <CardDescription>
              보조제의 상세 정보를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">제품명 *</Label>
                <Input
                  id="name"
                  placeholder="예: 마이프로틴 임팩트 웨이"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">브랜드</Label>
                <Input
                  id="brand"
                  placeholder="예: 마이프로틴"
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange('category', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dosage">권장 복용량</Label>
                <Input
                  id="dosage"
                  placeholder="예: 1일 3회, 1회 5g"
                  value={formData.dosage}
                  onChange={(e) => handleChange('dosage', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timing">섭취 시점</Label>
                <Input
                  id="timing"
                  placeholder="예: 운동 전, 식후"
                  value={formData.timing}
                  onChange={(e) => handleChange('timing', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                placeholder="보조제에 대한 설명을 입력하세요"
                rows={4}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productUrl">구매 링크 (선택)</Label>
              <Input
                id="productUrl"
                type="url"
                placeholder="https://..."
                value={formData.productUrl}
                onChange={(e) => handleChange('productUrl', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                쿠팡, 아이허브 등 구매 가능한 링크를 입력하세요
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">이미지 URL (선택)</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://..."
                value={formData.imageUrl}
                onChange={(e) => handleChange('imageUrl', e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !formData.name || !formData.category}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? '저장 중...' : '보조제 추가'}
              </Button>
              <Link href="/dashboard/supplements">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
