'use client'

interface Tag {
  id: string
  label: string
  color: 'blue' | 'green' | 'purple' | 'amber'
}

interface TagGroupProps {
  tags: Tag[]
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  amber: 'bg-amber-50 text-amber-600',
}

export const TagGroup = ({ tags }: TagGroupProps) => {
  return (
    <div className="flex items-center gap-1.5 overflow-hidden">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className={`px-2 py-0.5 text-[11px] rounded flex-shrink-0 ${colorMap[tag.color]}`}
        >
          {tag.label}
        </span>
      ))}
    </div>
  )
}
