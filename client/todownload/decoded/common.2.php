<?php

	function [obfuscated]() {
		eafjejcbhg( 'yum -y install iptables >> /tmp/install.log 2>&1;' );
		eafjejcbhg( '/sbin/iptables -F >> /tmp/install.log 2>&1;' );
		eafjejcbhg( 'rm -f /etc/sysconfig/iptables >> /tmp/install.log 2>&1;' );
		eafjejcbhg( 'touch /etc/sysconfig/iptables >> /tmp/install.log 2>&1;' );
		eafjejcbhg( 'cp /usr/local/solusvm/tmp/extras/iptables-config /etc/sysconfig/iptables-config >> /tmp/install.log 2>&1;' );


		if ($eibaffiif  = '6') {
			echo 'Installing KVM for RHEL 6...';
			eafjejcbhg( 'ln -sf /sbin/lvcreate /usr/sbin/lvcreate >> /tmp/install.log 2>&1;' );
			eafjejcbhg( 'ln -sf /sbin/lvdisplay /usr/sbin/lvdisplay >> /tmp/install.log 2>&1;' );
			eafjejcbhg( 'ln -sf /sbin/vgdisplay /usr/sbin/vgdisplay >> /tmp/install.log 2>&1;' );
			eafjejcbhg( 'ln -sf /sbin/lvremove /usr/sbin/lvremove >> /tmp/install.log 2>&1;' );
			eafjejcbhg( 'ln -sf /sbin/lvresize /usr/sbin/lvresize >> /tmp/install.log 2>&1;' );
			eafjejcbhg( 'ln -sf /sbin/lvreduce /usr/sbin/lvreduce >> /tmp/install.log 2>&1;' );
			eafjejcbhg( 'yum -y install dhcp >> /tmp/install.log 2>&1;' );
			eafjejcbhg( 'ln -sf /etc/dhcpd.conf /etc/dhcp/dhcpd.conf >> /tmp/install.log 2>&1;' );
		} else {
			echo 'Installing KVM for RHEL 5...';
		}

		eafjejcbhg( 'echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf' );
		eafjejcbhg( 'yum install -y kvm kmod-kvm qemu libvirt python-virtinst bridge-utils >> /tmp/install.log 2>&1;' );
		eafjejcbhg( 'service libvirtd start >> /tmp/install.log 2>&1;' );
		eafjejcbhg( 'chkconfig libvirtd on >> /tmp/install.log 2>&1;' );
		eafjejcbhg( 'chkconfig NetworkManager off >> /tmp/install.log 2>&1;' );
		eafjejcbhg( 'chkconfig network on >> /tmp/install.log 2>&1;' );
		eafjejcbhg( 'service NetworkManager stop >> /tmp/install.log 2>&1;' );
		eafjejcbhg( 'echo "echo 1 > /proc/sys/net/bridge/bridge-nf-call-iptables" >> /etc/rc.local;' );
		eafjejcbhg( 'yum -y install dhcp libguestfs-* libguestfs >> /tmp/install.log 2>&1;' );

		eafjejcbhg( 'cp /usr/local/solusvm/tmp/extras/lighttpd-master.conf /etc/lighttpd/lighttpd.conf >> /tmp/install.log 2>&1;' . ' >> /tmp/install.log 2>&1;' . 'service lighttpd start >> /tmp/install.log 2>&1' );

		eafjejcbhg( 'cp /usr/local/solusvm/tmp/extras/lighttpd-slave.conf /etc/lighttpd/lighttpd.conf >> /tmp/install.log 2>&1;' . ' >> /tmp/install.log 2>&1;' . 'service lighttpd start >> /tmp/install.log 2>&1' );
	}

?>