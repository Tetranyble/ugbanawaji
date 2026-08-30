import { PostEditor } from "@/components/admin/post-editor";
import { createPost } from "@/app/admin/actions";
import { getTaxonomyOptions } from "@/lib/taxonomy";
import { appTimeZone } from "@/lib/time";
import { db } from "@/db";
import { postSeries } from "@/db/schema";

export default async function NewPostPage() {
  const [taxonomy, series] = await Promise.all([getTaxonomyOptions(), db.select({ id: postSeries.id, title: postSeries.title }).from(postSeries).orderBy(postSeries.title)]);
  return <PostEditor appTimeZone={appTimeZone()} action={createPost} categoryOptions={taxonomy.categories.map((x) => x.name)} tagOptions={taxonomy.tags.map((x) => x.name)} seriesOptions={series} />;
}
