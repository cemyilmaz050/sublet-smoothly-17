
-- 1. Fix tenant_documents: remove role-based checks, scope manager access via sublet_requests only

-- Fix SELECT: remove the OR branch that checks role = 'manager'
DROP POLICY IF EXISTS "Managers can view tenant documents" ON public.tenant_documents;
CREATE POLICY "Managers can view tenant documents"
ON public.tenant_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sublet_requests sr
    WHERE sr.tenant_id = tenant_documents.tenant_id
      AND sr.manager_id = auth.uid()
  )
);

-- Fix UPDATE: scope to managers with a relationship, not just role = 'manager'
DROP POLICY IF EXISTS "Managers can update tenant documents" ON public.tenant_documents;
CREATE POLICY "Managers can update tenant documents"
ON public.tenant_documents
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sublet_requests sr
    WHERE sr.tenant_id = tenant_documents.tenant_id
      AND sr.manager_id = auth.uid()
  )
);

-- 2. Fix notifications INSERT: require auth.uid() = user_id
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
