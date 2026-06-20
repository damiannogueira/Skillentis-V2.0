CREATE POLICY "Users can delete own usage"
ON public.analysis_usage
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);