import { NewsletterCampaignEditor } from "@/components/admin/newsletter-campaign-editor";
import { createNewsletterCampaign } from "@/app/admin/newsletter-actions";
import { appTimeZone } from "@/lib/time";
export default function NewNewsletterCampaignPage(){ return <NewsletterCampaignEditor action={createNewsletterCampaign} appTimeZone={appTimeZone()}/>; }
