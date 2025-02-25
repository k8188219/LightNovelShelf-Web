import { ListResult } from '../types'

export interface BookInList {
  Id: number
  Cover: string
  Placeholder?: string
  LastUpdateTime: Date
  UserName: string
  Title: string
  Level?: number
  InteriorLevel?: number
  Category?: {
    ShortName: string
    Name: string
    Color: string
  }
}

export interface GetBookListRes extends ListResult<BookInList> {}
interface ChapterInfo {
  Title: string
  Id: number
}
export interface GetBookInfoRes {
  Book: {
    Arthur: string
    Category: any
    Chapter: ChapterInfo[]
    Id: number
    Cover: string
    Placeholder?: string
    ExtraInfo: any
    Introduction: string
    Author: string
    LastUpdate: string
    LastUpdateTime: Date
    CreatedTime: Date
    Likes: number
    Title: string
    CanEdit: boolean
    User: {
      Id: number
      Avatar: string
      UserName: string
    }
    Views: number
  }
  ReadPosition: any
}

export interface GetBookListRequest {
  Page: number
  Size: number
  KeyWords?: string
  Order?: 'new' | 'view' | 'latest'
  IgnoreJapanese?: boolean
}

export interface SaveReadPositionRequest {
  Bid: number
  Cid: number
  XPath: string
}

export interface EditBookRequest {
  Bid: number
  Cover: string
  Title: string
  Author: string
  Introduction: string
  // 分类ID
  CategoryId: number
}
