import { MongoClient } from "./deps.ts";
import { basename, join } from "https://deno.land/std@0.156.0/path/mod.ts";
import {
  DB_NAME,
  DB_PASSWORD,
  DB_PATH,
  DB_SEC_MECHANISM,
  DB_USER,
} from "./config.ts";
import {
  AuthorSchema,
  DocSchema,
  DocSectionSchema,
  PostSchema,
} from "./schema.ts";
import { Collection } from "https://deno.land/x/mongo@v0.31.1/mod.ts";

const client = new MongoClient();
await client.connect(
  `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_PATH}?authMechanism=${DB_SEC_MECHANISM}`
);
const db = client.database(DB_NAME);
const posts = db.collection<PostSchema>("posts");
const authors = db.collection<AuthorSchema>("authors");
const docs = db.collection<DocSchema>("docs");
const docSections = db.collection<DocSectionSchema>("doc-sections");

const dropCollection = async (collection: Collection<unknown>) => {
  try {
    await collection.drop();
  } catch {
    console.log("collection does not exist");
  }
};

await dropCollection(posts);
await dropCollection(authors);
await dropCollection(docs);
await dropCollection(docSections);

const idIndex = { name: "id", unique: true, key: { id: 1 } };
await posts.createIndexes({
  indexes: [idIndex],
});
await authors.createIndexes({
  indexes: [idIndex],
});
await docs.createIndexes({
  indexes: [idIndex],
});
await docSections.createIndexes({
  indexes: [
    {
      name: "id",
      unique: true,
      key: { documentationId: 1, sectionId: 1, subSectionId: 1 },
    },
  ],
});

const postsData = JSON.parse(
  await Deno.readTextFile("./blog/posts/_metadata.json")
);

const authorsData = JSON.parse(
  await Deno.readTextFile("./blog/posts/_authors.json")
);

const docsData = JSON.parse(await Deno.readTextFile("./docs/_docs.json"));

for (const id of Object.getOwnPropertyNames(postsData)) {
  const newPost: PostSchema = {
    id,
    title: postsData[id].title,
    markdown: await Deno.readTextFile(`./blog/posts/${id}.md`),
    description: postsData[id].description,
    thumbnail: postsData[id].thumbnail,
    author: postsData[id].author,
    tags: [],
    date: new Date(postsData[id].date),
  };

  await posts.insertOne(newPost);
}

for (const id of Object.getOwnPropertyNames(authorsData)) {
  const newAuthor: AuthorSchema = {
    id,
    description: authorsData[id].description,
    youtube: authorsData[id].youtube,
    thumbnail: authorsData[id].thumbnail,
  };

  await authors.insertOne(newAuthor);
}

for (const id of Object.getOwnPropertyNames(docsData)) {
  const newDoc: DocSchema = {
    id,
    ...docsData[id],
  };

  await docs.insertOne(newDoc);
}

for await (const doc of Deno.readDir("docs")) {
  if (doc.isDirectory) {
    for await (const section of Deno.readDir(join("docs", doc.name))) {
      if (section.isDirectory) {
        for await (const subSection of Deno.readDir(
          join("docs", doc.name, section.name)
        )) {
          if (subSection.isFile) {
            const path = join("docs", doc.name, section.name, subSection.name);
            const documentationId = doc.name;
            const sectionId = section.name;
            const subSectionId = basename(subSection.name, ".md");
            console.log(`Loading ${path}...`);
            const newDocSection: DocSectionSchema = {
              documentationId,
              sectionId,
              subSectionId,
              markdown: await Deno.readTextFile(join(path)),
            };

            await docSections.insertOne(newDocSection);
          }
        }
      }
    }
  }
}
