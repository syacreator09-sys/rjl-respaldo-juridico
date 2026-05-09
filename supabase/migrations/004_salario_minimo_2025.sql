-- Migration 004: Actualizar salario mínimo 2025 en system_config
-- DOF 28-nov-2024: salario mínimo general vigente desde 01-ene-2025
-- General: $278.80 MXN/día | Zona Frontera Norte: $419.88 MXN/día

UPDATE system_config
SET
  value = '278.80',
  description = 'Salario mínimo general vigente en MXN/día (actualizado 2025, DOF 28-nov-2024)',
  updated_at = NOW()
WHERE key = 'salario_minimo_diario';

-- Agregar zona frontera norte si no existe
INSERT INTO system_config (key, value, description)
VALUES (
  'salario_minimo_diario_zona_frontera',
  '419.88',
  'Salario mínimo Zona Libre Frontera Norte en MXN/día (2025, DOF 28-nov-2024)'
)
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Verificación (comentar en prod)
-- SELECT key, value, description FROM system_config WHERE key LIKE 'salario%';
