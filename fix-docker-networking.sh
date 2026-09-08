#!/bin/bash

# Script para corregir problemas de conectividad en Docker
# Agrega reglas de iptables para permitir comunicación entre contenedores

echo "Configurando reglas de iptables para Docker..."

# Permitir tráfico entre interfaces bridge
sudo iptables-legacy -A FORWARD -i br+ -o br+ -j ACCEPT 2>/dev/null
echo "✓ Permitir tráfico entre interfaces bridge"

# Permitir tráfico saliente desde interfaces bridge
sudo iptables-legacy -A FORWARD -i br+ -j ACCEPT 2>/dev/null
echo "✓ Permitir tráfico saliente desde bridge"

# Permitir tráfico entrante hacia interfaces bridge
sudo iptables-legacy -A FORWARD -o br+ -j ACCEPT 2>/dev/null
echo "✓ Permitir tráfico entrante hacia bridge"

# Permitir ICMP (ping) entre contenedores
sudo iptables-legacy -A FORWARD -p icmp -j ACCEPT 2>/dev/null
echo "✓ Permitir ICMP/ping"

# Guardar las reglas
echo ""
echo "Guardando reglas de iptables..."

if command -v iptables-save &> /dev/null; then
    sudo iptables-legacy-save > /etc/iptables/rules.v4 2>/dev/null
    echo "✓ Reglas guardadas en /etc/iptables/rules.v4"
else
    echo "⚠ iptables-persistent no está instalado. Las reglas se perderán en el reinicio."
    echo "  Ejecuta: sudo apt-get install -y iptables-persistent"
fi

echo ""
echo "Verificando reglas instaladas..."
sudo iptables-legacy -L FORWARD | grep -E "br\+|icmp" | sed 's/^/  /'

echo ""
echo "✓ Configuración completada"
