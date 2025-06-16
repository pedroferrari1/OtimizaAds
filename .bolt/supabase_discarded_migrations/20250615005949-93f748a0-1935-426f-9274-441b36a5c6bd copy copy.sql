
-- Definir usuário como administrador
UPDATE public.profiles 
SET role = 'ADMIN' 
WHERE id = '87d99214-2566-46e7-b856-5aff9a037641';

-- Verificar se a atualização foi bem-sucedida
SELECT id, email, full_name, role, created_at 
FROM public.profiles 
WHERE id = '87d99214-2566-46e7-b856-5aff9a037641';
