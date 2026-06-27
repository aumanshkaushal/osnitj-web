import AdminDispatchEditor from "@/components/admin-dispatch-editor";

export const metadata = {
  title: "Create Dispatch | OpenSource @ NITJ",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NewDispatchPage() {
  return <AdminDispatchEditor />;
}
