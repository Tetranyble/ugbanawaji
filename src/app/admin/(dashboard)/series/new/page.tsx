import { createSeries } from "@/app/admin/actions";
import { SeriesEditor } from "@/components/admin/series-editor";

export default function NewSeriesPage() {
  return <SeriesEditor action={createSeries} />;
}
