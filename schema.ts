import { ObjectId } from "https://deno.land/x/mongo@v0.31.1/mod.ts";

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
  hidden: boolean;
  syncedOn: Date;
  updatedOn: Date;
}

export interface AuthorSchema {
  _id?: ObjectId;
  id: string;
  youtube: string;
  description: string;
  thumbnail: string;
  syncedOn: Date;
  updatedOn: Date;
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
  authors: string[];
  hidden: boolean;
  syncedOn: Date;
  updatedOn: Date;
}

export interface DocSectionSchema {
  _id?: ObjectId;
  documentationId: string;
  sectionId: string;
  subSectionId: string;
  markdown: string;
  syncedOn: Date;
  updatedOn: Date;
}
