import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { postSeries } from "@/db/schema";
import { deleteSeries, updateSeries } from "@/app/admin/actions";
import { SeriesEditor } from "@/components/admin/series-editor";

export default async function EditSeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [series] = await db.select().from(postSeries).where(eq(postSeries.id, id)).limit(1);
  if (!series) notFound();
  return <SeriesEditor series={series} action={updateSeries.bind(null, id)} deleteAction={deleteSeries.bind(null, id)} />;
}
