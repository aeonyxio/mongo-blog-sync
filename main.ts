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
import { MongoClient } from "https://deno.land/x/mongo@v0.31.1/mod.ts";
import { isDeepStrictEqual } from "https://deno.land/std@0.151.0/node/util.ts?s=isDeepStrictEqual";

const client = new MongoClient();
await client.connect(
  `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_PATH}?authMechanism=${DB_SEC_MECHANISM}`
);
const db = client.database(DB_NAME);
const posts = db.collection<PostSchema>("posts");
const authors = db.collection<AuthorSchema>("authors");
const docs = db.collection<DocSchema>("docs");
const docSections = db.collection<DocSectionSchema>("doc-sections");

const parseFiles = async (dryRun: boolean) => {
  if (!dryRun) {
    const idIndex = { name: "id", unique: true, key: { id: 1 } };
    const authorIndex = { name: "author", key: { author: 1 } };
    const authorsIndex = { name: "authors", key: { authors: 1 } };

    await posts.createIndexes({
      indexes: [idIndex, authorIndex],
    });
    await authors.createIndexes({
      indexes: [idIndex],
    });
    await docs.createIndexes({
      indexes: [idIndex, authorsIndex],
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
  }

  const postsData = JSON.parse(
    await Deno.readTextFile("./blog/posts/_metadata.json")
  );

  const authorsData = JSON.parse(
    await Deno.readTextFile("./blog/posts/_authors.json")
  );

  const docsData = JSON.parse(await Deno.readTextFile("./docs/_docs.json"));

  const currDateTime = new Date();

  console.log(`\n======= Processing Posts =======`);
  for (const id of Object.getOwnPropertyNames(postsData)) {
    const newRecord: PostSchema = {
      id,
      title: postsData[id].title,
      markdown: await Deno.readTextFile(`./blog/posts/${id}.md`),
      description: postsData[id].description,
      thumbnail: postsData[id].thumbnail,
      author: postsData[id].author,
      tags: [],
      hidden: false,
      date: new Date(postsData[id].date),
      updatedOn: currDateTime,
      syncedOn: currDateTime,
    };

    if (!dryRun) {
      const filter = {
        id: newRecord.id,
      };

      const existingRecord = await posts.findOne(filter);

      if (existingRecord) {
        delete existingRecord._id;
        const originalUpdatedOnDate = existingRecord.updatedOn;
        existingRecord.updatedOn = newRecord.updatedOn;
        existingRecord.syncedOn = newRecord.syncedOn;
        if (!isDeepStrictEqual(newRecord, existingRecord)) {
          console.log(`Updating`, filter);
          await posts.replaceOne(filter, newRecord);
        } else {
          console.log(`Ignoring`, filter);
          existingRecord.updatedOn = originalUpdatedOnDate;
          await posts.replaceOne(filter, existingRecord);
        }
      } else {
        console.log(`Creating`, filter);
        await posts.insertOne(newRecord);
      }
    }
  }

  console.log(`\n======= Processing Authors =======`);
  for (const id of Object.getOwnPropertyNames(authorsData)) {
    const newRecord: AuthorSchema = {
      id,
      description: authorsData[id].description,
      youtube: authorsData[id].youtube,
      thumbnail: authorsData[id].thumbnail,
      updatedOn: currDateTime,
      syncedOn: currDateTime,
    };

    if (!dryRun) {
      const filter = {
        id: newRecord.id,
      };

      const existingRecord = await authors.findOne(filter);

      if (existingRecord) {
        delete existingRecord._id;
        const originalUpdatedOnDate = existingRecord.updatedOn;
        existingRecord.updatedOn = newRecord.updatedOn;
        existingRecord.syncedOn = newRecord.syncedOn;
        if (!isDeepStrictEqual(newRecord, existingRecord)) {
          console.log(`Updating`, filter);
          await authors.replaceOne(filter, newRecord);
        } else {
          existingRecord.updatedOn = originalUpdatedOnDate;
          console.log(`Ignoring`, filter);
          await authors.replaceOne(filter, existingRecord);
        }
      } else {
        console.log(`Creating`, filter);
        await authors.insertOne(newRecord);
      }
    }
  }

  console.log(`\n======= Processing Docs =======`);
  for (const id of Object.getOwnPropertyNames(docsData)) {
    const newRecord: DocSchema = {
      id,
      ...docsData[id],
      hidden: false,
      updatedOn: currDateTime,
      syncedOn: currDateTime,
    };

    if (!dryRun) {
      const filter = {
        id: newRecord.id,
      };

      const existingRecord = await docs.findOne(filter);

      if (existingRecord) {
        delete existingRecord._id;
        const originalUpdatedOnDate = existingRecord.updatedOn;
        existingRecord.updatedOn = newRecord.updatedOn;
        existingRecord.syncedOn = newRecord.syncedOn;
        if (!isDeepStrictEqual(newRecord, existingRecord)) {
          console.log(`Updating`, filter);
          await docs.replaceOne(filter, newRecord);
        } else {
          existingRecord.updatedOn = originalUpdatedOnDate;
          console.log(`Ignoring`, filter);
          await docs.replaceOne(filter, existingRecord);
        }
      } else {
        console.log(`Creating`, filter);
        await docs.insertOne(newRecord);
      }
    }

    for (const documentationId of Object.keys(docsData)) {
      for (const sectionId of Object.keys(docsData[documentationId].sections)) {
        for (const subSectionId of Object.keys(
          docsData[documentationId].sections[sectionId].subSections
        )) {
          const path = join(
            "docs",
            documentationId,
            sectionId,
            `${subSectionId}.md`
          );

          const newRecord: DocSectionSchema = {
            documentationId,
            sectionId,
            subSectionId,
            markdown: await Deno.readTextFile(join(path)),
            updatedOn: currDateTime,
            syncedOn: currDateTime,
          };

          if (!dryRun) {
            const filter = {
              documentationId: newRecord.documentationId,
              sectionId: newRecord.sectionId,
              subSectionId: newRecord.subSectionId,
            };

            const existingRecord = await docSections.findOne(filter);

            if (existingRecord) {
              delete existingRecord._id;
              const originalUpdatedOnDate = existingRecord.updatedOn;
              existingRecord.updatedOn = newRecord.updatedOn;
              existingRecord.syncedOn = newRecord.syncedOn;
              if (!isDeepStrictEqual(newRecord, existingRecord)) {
                console.log(`Updating`, filter);
                await docSections.replaceOne(filter, newRecord);
              } else {
                existingRecord.updatedOn = originalUpdatedOnDate;
                console.log(`Ignoring`, filter);
                await docSections.replaceOne(filter, existingRecord);
              }
            } else {
              console.log(`Creating`, filter);
              await docSections.insertOne(newRecord);
            }
          }
        }
      }
    }
  }

  if (!dryRun) {
    console.log(`\n======= Deleting anything applicable =======`);
    const deleteFilter = { syncedOn: { $ne: currDateTime } };
    const logDeleteCount = (type: string) => (num: number) =>
      console.log(`Deleted ${num} ${type}`);
    await posts.deleteMany(deleteFilter).then(logDeleteCount("posts"));
    await authors.deleteMany(deleteFilter).then(logDeleteCount("authors"));
    await docs.deleteMany(deleteFilter).then(logDeleteCount("docs"));
    await docSections
      .deleteMany(deleteFilter)
      .then(logDeleteCount("doc sections"));
  }
};

await parseFiles(true);
await parseFiles(false);
