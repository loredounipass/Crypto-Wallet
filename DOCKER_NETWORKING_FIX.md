# Solución de Problemas de Conectividad en Docker

## Problema
Los contenedores de Docker presentaban errores de timeout al conectar a Redis y MongoDB:
```
Error: connect ETIMEDOUT
  code: 'ETIMEDOUT',
  syscall: 'connect'
```

## Causa
Las reglas de iptables en la política `FORWARD` estaban configuradas con:
- **Policy DROP**: Todo tráfico no permitido explícitamente era rechazado
- **Falta de reglas**: No había reglas que permitieran la comunicación entre contenedores en redes bridge personalizadas

## Solución Implementada

Se agregaron las siguientes reglas de iptables:

```bash
sudo iptables-legacy -A FORWARD -i br+ -o br+ -j ACCEPT    # Tráfico entre bridges
sudo iptables-legacy -A FORWARD -i br+ -j ACCEPT           # Salida desde bridges
sudo iptables-legacy -A FORWARD -o br+ -j ACCEPT           # Entrada hacia bridges
sudo iptables-legacy -A FORWARD -p icmp -j ACCEPT          # Permitir ICMP/ping
```

Estas reglas permiten:
- ✅ Comunicación entre contenedores en la red `backend`
- ✅ Conectividad a Redis (puerto 6379)
- ✅ Conectividad a MongoDB (puerto 27017)
- ✅ Diagnóstico de red con `ping`

## Estado Actual

Todos los contenedores están saludables:

| Servicio | Estado | Problema |
|----------|--------|----------|
| Redis | Healthy ✓ | - |
| MongoDB | Healthy ✓ | - |
| app-core-1 | Healthy ✓ | - |
| app-core-2 | Healthy ✓ | - |
| backend-daemons-workers | Running ✓ | - |
| nginx | Healthy ✓ | - |
| backup | Running ✓ | - |

## Persistencia de Cambios

Para hacer persistentes estas reglas ante reinicios del sistema:

### Opción 1: Usar el script proporcionado
```bash
./fix-docker-networking.sh
```

### Opción 2: Manual
```bash
# 1. Instalar iptables-persistent
sudo apt-get install -y iptables-persistent

# 2. Guardar las reglas
sudo iptables-legacy-save > /etc/iptables/rules.v4

# 3. Reiniciar el servicio
sudo systemctl restart iptables
```

## Verificación

Para verificar que las reglas están activas:
```bash
sudo iptables-legacy -L FORWARD
```

Deberías ver líneas con:
- `-A FORWARD -i br+ -o br+ -j ACCEPT`
- `-A FORWARD -i br+ -j ACCEPT`
- `-A FORWARD -o br+ -j ACCEPT`
- `-A FORWARD -p icmp -j ACCEPT`

Para probar la conectividad entre contenedores:
```bash
docker exec crypto-wallet-app-core-1 ping -c 2 redis
docker exec crypto-wallet-app-core-1 nc -zv redis 6379
```

## Archivos Relacionados
- `fix-docker-networking.sh` - Script para aplicar y persistir las correcciones
- `docker-compose.yml` - Configuración de los servicios
- `/etc/iptables/rules.v4` - Archivo de reglas persistentes (después de aplicar la solución)

---

**Fecha de resolución**: 2026-09-08
**Cambios aplicados en**: iptables-legacy (configuración de red)
