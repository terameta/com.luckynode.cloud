#COMMON 3 HAS MORE LINES, GO BACK TO THAT AND CHECK IF WE NEED SOME MORE OF IT
apt-get -y update >> /tmp/install.log 2>&1
apt-get -y upgrade >> /tmp/install.log 2>&1
apt-get -y dist-upgrade >> /tmp/install.log 2>&1
apt-get -y install iptables >> /tmp/install.log 2>&1;
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
apt-get install -y kvm  >> /tmp/install.log 2>&1;
apt-get install -y qemu  >> /tmp/install.log 2>&1;
apt-get install -y libvirt-bin  >> /tmp/install.log 2>&1;
apt-get install -y qemu-kvm  >> /tmp/install.log 2>&1;
apt-get install -y bridge-utils >> /tmp/install.log 2>&1;
apt-get install -y supermin >> /tmp/install.log 2>&1;
apt-get install -y debconf-utils >> /tmp/install.log 2>&1;
echo libguestfs-tools libguestfs/update-appliance boolean true | debconf-set-selections
apt-get install -y libguestfs-tools >> /tmp/install.log 2>&1;
#HERE CHECK IF ANYTHING ADDITIONAL IS INSTALLED
apt-get -y install libguestfs0 >> /tmp/install.log 2>&1;
apt-get -y install libguestfs-*  >> /tmp/install.log 2>&1;

## apt-get -y install fail2ban >> /tmp/install.log 2>&1;

service libvirt-bin start >> /tmp/install.log 2>&1;
chkconfig libvirtd on >> /tmp/install.log 2>&1;
chkconfig NetworkManager off >> /tmp/install.log 2>&1;
chkconfig network on >> /tmp/install.log 2>&1;
service NetworkManager stop >> /tmp/install.log 2>&1;
echo "echo 1 > /proc/sys/net/bridge/bridge-nf-call-iptables" >> /etc/rc.local;


cp /usr/local/solusvm/tmp/extras/lighttpd-master.conf /etc/lighttpd/lighttpd.conf >> /tmp/install.log 2>&1;' . ' >> /tmp/install.log 2>&1;' . 'service lighttpd start >> /tmp/install.log 2>&1

cp /usr/local/solusvm/tmp/extras/lighttpd-slave.conf /etc/lighttpd/lighttpd.conf >> /tmp/install.log 2>&1;' . ' >> /tmp/install.log 2>&1;' . 'service lighttpd start >> /tmp/install.log 2>&1