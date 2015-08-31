#HERE LEt's check if virtualization is supported on the server
#apt-get -y perl  >> /tmp/install.log 2>&1
apt-get -y update >> /tmp/install.log 2>&1
apt-get -y upgrade >> /tmp/install.log 2>&1
apt-get -y dist-upgrade >> /tmp/install.log 2>&1
#apt-get -y install glibc glibc-devel glibc-devel.i686 >> /tmp/install.log 2>&1
apt-get -y install iptables >> /tmp/install.log 2>&1;
/sbin/iptables -F >> /tmp/install.log 2>&1;
rm -f /etc/sysconfig/iptables >> /tmp/install.log 2>&1;
touch /etc/sysconfig/iptables >> /tmp/install.log 2>&1;
cp /usr/local/solusvm/tmp/extras/iptables-config /etc/sysconfig/iptables-config >> /tmp/install.log 2>&1;

echo 'Installing KVM for RHEL 6...';
ln -sf /sbin/lvcreate /usr/sbin/lvcreate >> /tmp/install.log 2>&1;
ln -sf /sbin/lvdisplay /usr/sbin/lvdisplay >> /tmp/install.log 2>&1;
ln -sf /sbin/vgdisplay /usr/sbin/vgdisplay >> /tmp/install.log 2>&1;
ln -sf /sbin/lvremove /usr/sbin/lvremove >> /tmp/install.log 2>&1;
ln -sf /sbin/lvresize /usr/sbin/lvresize >> /tmp/install.log 2>&1;
ln -sf /sbin/lvreduce /usr/sbin/lvreduce >> /tmp/install.log 2>&1;
#apt-get -y install dhcp >> /tmp/install.log 2>&1;
#dnsmasq will be used instead of dhcp
ln -sf /etc/dhcpd.conf /etc/dhcp/dhcpd.conf >> /tmp/install.log 2>&1;

echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
apt-get install -y kvm  >> /tmp/install.log 2>&1;
#apt-get install -y kmod-kvm >> /tmp/install.log 2>&1;
apt-get install -y qemu  >> /tmp/install.log 2>&1;
apt-get install -y libvirt-bin  >> /tmp/install.log 2>&1;
apt-get install -y qemu-kvm  >> /tmp/install.log 2>&1;
# I really dont know if we need this
# apt-get install -y python-virtinst >> /tmp/install.log 2>&1;
apt-get install -y bridge-utils >> /tmp/install.log 2>&1;
# I really dont know if we need this
apt-get install -y supermin >> /tmp/install.log 2>&1;
apt-get install -y libguestfs-tools >> /tmp/install.log 2>&1;

service libvirtd start >> /tmp/install.log 2>&1;
chkconfig libvirtd on >> /tmp/install.log 2>&1;
chkconfig NetworkManager off >> /tmp/install.log 2>&1;
chkconfig network on >> /tmp/install.log 2>&1;
service NetworkManager stop >> /tmp/install.log 2>&1;
echo "echo 1 > /proc/sys/net/bridge/bridge-nf-call-iptables" >> /etc/rc.local;
apt-get -y install dhcp libguestfs-* libguestfs >> /tmp/install.log 2>&1;

cp /usr/local/solusvm/tmp/extras/lighttpd-master.conf /etc/lighttpd/lighttpd.conf >> /tmp/install.log 2>&1;' . ' >> /tmp/install.log 2>&1;' . 'service lighttpd start >> /tmp/install.log 2>&1

cp /usr/local/solusvm/tmp/extras/lighttpd-slave.conf /etc/lighttpd/lighttpd.conf >> /tmp/install.log 2>&1;' . ' >> /tmp/install.log 2>&1;' . 'service lighttpd start >> /tmp/install.log 2>&1