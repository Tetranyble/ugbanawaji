import { createProject } from "@/app/admin/actions";
import { ProjectEditor } from "@/components/admin/project-editor";
export default function NewProjectPage(){return <ProjectEditor action={createProject}/>}
