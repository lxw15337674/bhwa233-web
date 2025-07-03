'use client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronsUpDown, Plus, Tag, X } from 'lucide-react'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { AutosizeTextarea } from '../../src/components/ui/AutosizeTextarea';


export default function Page() {

    // 更新 JSX 以渲染分组后的未完成任务
    return (
        <div className="flex-1 p-2 " suppressHydrationWarning >
            <p>Task functionality has been temporarily removed.</p>
        </div>
    )
}

