import Navbar from "@/components/Navbar";
import EmptyState from "@/components/EmptyState";
import { MessageSquare } from "lucide-react";

const MessagesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Messages</h1>
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="Messages will appear here once a subtenant applies to your listing or you start a conversation with a tenant."
        />
      </div>
    </div>
  );
};

export default MessagesPage;
