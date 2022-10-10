import { ObjectId } from "./deps.ts";

export interface PostSchema {
  _id?: ObjectId;
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  markdown: string;
  tags: string[];
  author: string;
  date: Date;
}

export interface AuthorSchema {
  _id?: ObjectId;
  id: string;
  youtube: string;
  description: string;
  thumbnail: string;
}

export interface DocSchema {
  _id?: ObjectId;
  id: string;
  title: string;
  default: string;
  sections: Record<
    string,
    {
      title: string;
      subSections: Record<
        string,
        {
          title: string;
        }
      >;
    }
  >;
}

export interface DocSectionSchema {
  _id?: ObjectId;
  documentationId: string;
  sectionId: string;
  subSectionId: string;
  markdown: string;
}
