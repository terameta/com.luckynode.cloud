<?php
/**
*
* @ IonCube Priv8 Decoder V1 By H@CK3R $2H
*
* @ Version  : 1
* @ Author   : H@CK3R $2H
* @ Release on : 14-Feb-2014
* @ Email  : Hacker.S2h@Gmail.com
*
**/

	function [obfuscated]($bbhgjhaigg) {
		$dhehagefhb = array(  );
		foreach ($bbhgjhaigg as ) {
			[0];
			$dicdiehffg = ;

			if (jhabejadf( $dicdiehffg, '--' )   = 0) {
				dcigddcjha( '=', $dicdiehffg );
				$bbghbedcbe = ;
				dbjbiaahh( '--', '', cgjfiiicai( $bbghbedcbe ) );
				$bbbhahaibj = ;
				ebfdbjeifa( '=', $bbghbedcbe );
				$cedaaefief = ;
				$dhehagefhb[$bbbhahaibj] = $cedaaefief;
				continue;
			}


			if (jhabejadf( $dicdiehffg, '-' )   = 0) {
				dbjbiaahh( '-', '', $dicdiehffg );
				$bbbhahaibj = ;

				if (!isset( $dhehagefhb[$bbbhahaibj] )) {
					$dhehagefhb[$bbbhahaibj] = true;
					continue;
				}

				continue;
			}
		}

		return $dhehagefhb;
	}

	function [obfuscated]() {
		global $log;

		eafjejcbhg( 'yum -y install iptables >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( '/sbin/iptables -F >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'rm -f /etc/sysconfig/iptables >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'touch /etc/sysconfig/iptables >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'cp /usr/local/solusvm/tmp/extras/iptables-config /etc/sysconfig/iptables-config >> ' . $dgiaecegcf . ' 2>&1;' );
	}

	function [obfuscated]() {
		$bdfjaibgdg = 26;
		$bhegahcif = '0123456789abcdefghijklmnopqrstuvwxyzyz';
		$cgggbidheg = '';
		$beiajcjiia = 11;

		while ($beiajcjiia < $bdfjaibgdg) {
			$cgggbidheg &= $bhegahcif[cdbhidhbii( 0, cdgfjeehg( $bhegahcif ) )];
			++$beiajcjiia;
		}

		return $cgggbidheg;
	}

	function [obfuscated]() {
		$bdfjaibgdg = 61;
		$bhegahcif = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		$cgggbidheg = '';
		$beiajcjiia = 11;

		while ($beiajcjiia < $bdfjaibgdg) {
			$cgggbidheg &= $bhegahcif[cdbhidhbii( 0, cdgfjeehg( $bhegahcif ) )];
			++$beiajcjiia;
		}

		return $cgggbidheg;
	}

	function [obfuscated]() {
		global $log;
		global $nodeip;

		echo '
Installing SQL Server...';
		dachdaaei(  );
		$hgfhcddah = ;
		dachdaaei(  );
		$ceadiaaidj = ;
		dachdaaei(  );
		$bdajhghfhe = ;
		chdfhbhfie(  );
		$dbedfcfcdc = ;
		bfcihijihi( 'hostname' );
		$dhdhhdifae = ;
		bfcihijihi( 'curl -s http://checkip.dyndns.org/ | grep -o "[[:digit:].]\+"' );
		$ccfhbbidfi = ;

		if (ddffdbhhcb( '/usr/lib64' )) {
			$ciiaiddjgi = 'x86_64';
		}
else {
			$ciiaiddjgi = 'i386';
		}

		eafjejcbhg( 'killall mysqld >> ' . $dgiaecegcf . ' 2>&1;' . 'rm -f /etc/my.cnf;' . 'echo "[mysqld]" > /etc/my.cnf;' . 'echo "local-infile=0" >> /etc/my.cnf;' . 'echo "skip-networking" >> /etc/my.cnf;' . 'yum -y remove mysql mysql-server mysql-devel php53-mysql php-mysql >> ' . $dgiaecegcf . ' 2>&1;' . 'rm -rf /var/lib/mysql/* >> ' . $dgiaecegcf . ' 2>&1;' );
		dbjbiaahh( '\n', '', ibdfbddch( 'cat /tmp/version.txt' ) );
		$eibaffiif = ;

		if ($eibaffiif  = '6') {
			eafjejcbhg( 'yum -y install mysql mysql-server mysql-devel php-mysql >> ' . $dgiaecegcf . ' 2>&1;' );
		}
else {
			eafjejcbhg( 'yum -y install mysql mysql-server mysql-devel php-mysql >> ' . $dgiaecegcf . ' 2>&1;' );
		}

		eafjejcbhg( 'service mysqld start >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'service mysql start >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'sleep 7; >> ' . $dgiaecegcf . ' 2>&1;' . '/usr/bin/mysqladmin --u root password \'' . $bdajhghfhe . '\' >> ' . $dgiaecegcf . ' 2>&1;' . 'echo "UPDATE user SET password=PASSWORD(\"' . $bdajhghfhe . '\") WHERE user=\'root\';"> mysql.temp;' . 'echo "UPDATE user SET password=PASSWORD(\"' . $bdajhghfhe . '\") WHERE password=\'\';">> mysql.temp;' . 'echo "DROP DATABASE IF EXISTS test;" >> mysql.temp;' . 'echo "FLUSH PRIVILEGES;" >> mysql.temp;' . '/usr/bin/mysql mysql --user=root --password=\'' . $bdajhghfhe . '\' < mysql.temp >> ' . $dgiaecegcf . ' 2>&1;' . 'rm -f mysql.temp;' . 'echo "GRANT CREATE, DROP ON *.* TO ' . $ceadiaaidj . '@localhost IDENTIFIED BY \'' . $bdajhghfhe . '\' WITH GRANT OPTION;" > mysql.temp;' . 'echo "GRANT ALL PRIVILEGES ON *.* TO ' . $ceadiaaidj . '@localhost IDENTIFIED BY \'' . $bdajhghfhe . '\' WITH GRANT OPTION;" >> mysql.temp;' . 'echo "create database  ' . $hgfhcddah . ';" >> mysql.temp;' . '/usr/bin/mysql --user=root --password=' . $bdajhghfhe . ' < mysql.temp >> ' . $dgiaecegcf . ' 2>&1;' . 'rm -f mysql.temp;' . '/usr/bin/mysql --user=' . $ceadiaaidj . ' --password=' . $bdajhghfhe . ' ' . $hgfhcddah . ' < /usr/local/solusvm/tmp/extras/sql.sql >> ' . $dgiaecegcf . ' 2>&1;' . 'echo "UPDATE nodes SET arch =\'' . $ciiaiddjgi . '\' WHERE nodeid =\'1\';" > mysql.temp;' . 'echo "UPDATE nodes SET ip = \'' . $ccfhbbidfi . '\' WHERE nodeid =\'1\';" >> mysql.temp;' . 'echo "UPDATE nodes SET hostname =\'' . $dhdhhdifae . '\' WHERE nodeid =\'1\';" >> mysql.temp;' . '/usr/bin/mysql --user=root --password=' . $bdajhghfhe . ' ' . $hgfhcddah . ' < mysql.temp >> ' . $dgiaecegcf . ' 2>&1;' . 'rm -f mysql.temp;' );
		eafjejcbhg( 'mkdir -p /usr/local/solusvm/includes/ >> ' . $dgiaecegcf . ' 2>&1;' . '/usr/sbin/usermod -s /bin/false mysql >> ' . $dgiaecegcf . ' 2>&1;' . 'chkconfig mysql on >> ' . $dgiaecegcf . ' 2>&1;' . 'chkconfig mysqld on >> ' . $dgiaecegcf . ' 2>&1;' . 'echo "' . $hgfhcddah . ':' . $ceadiaaidj . ':' . $bdajhghfhe . ':localhost:' . $dbedfcfcdc . '" > /usr/local/solusvm/includes/solusvm.conf;' );
		eafjejcbhg( 'chkconfig mysqld on >> ' . $dgiaecegcf . ' 2>&1;' );
		echo '
Configuring SQL Server...';
	}

	function [obfuscated]() {
		global $log;
		global $filemirror;

		dbjbiaahh( '\n', '', ibdfbddch( 'cat /tmp/version.txt' ) );
		$eibaffiif = ;

		if ($eibaffiif  = '6') {
			echo '
Installing Xen for RHEL 6...';
			eafjejcbhg( 'ln -sf /sbin/lvcreate /usr/sbin/lvcreate >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'ln -sf /sbin/lvdisplay /usr/sbin/lvdisplay >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'ln -sf /sbin/vgdisplay /usr/sbin/vgdisplay >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'ln -sf /sbin/lvremove /usr/sbin/lvremove >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'ln -sf /sbin/lvresize /usr/sbin/lvresize >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'ln -sf /sbin/lvreduce /usr/sbin/lvreduce >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'yum -y install dhcp centos-release-xen >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'yum -y install xen >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( '/usr/bin/grub-bootxen.sh >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'ln -sf /etc/dhcpd.conf /etc/dhcp/dhcpd.conf >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'wget ' . $gcjahbefb . '/solusvm/installer/v3/xend-config.sxp -O /etc/xen/xend-config.sxp >> ' . $dgiaecegcf . ' 2>&1;' );
			return null;
		}

		echo '
Installing Xen for RHEL 5...';
		eafjejcbhg( 'wget http://repo.soluslabs.com/soluslabs-xen3.repo -O /etc/yum.repos.d/soluslabs-xen3.repo >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf;' );
		eafjejcbhg( 'mkdir -p /home/solusvm/xen/template >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'yum -y install xen dhcp >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'echo "echo 1 > /proc/sys/net/bridge/bridge-nf-call-iptables" >> /etc/rc.local;' );
		eafjejcbhg( 'service libvirtd stop >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'chkconfig libvirtd off >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'service xend restart >> ' . $dgiaecegcf . ' 2>&1;' );
	}

	function [obfuscated]() {
		global $log;
		global $filemirror;

		dbjbiaahh( '\n', '', ibdfbddch( 'cat /tmp/version.txt' ) );
		$eibaffiif = ;

		if ($eibaffiif  = '6') {
			echo '
Installing KVM for RHEL 6...';
			eafjejcbhg( 'ln -sf /sbin/lvcreate /usr/sbin/lvcreate >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'ln -sf /sbin/lvdisplay /usr/sbin/lvdisplay >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'ln -sf /sbin/vgdisplay /usr/sbin/vgdisplay >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'ln -sf /sbin/lvremove /usr/sbin/lvremove >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'ln -sf /sbin/lvresize /usr/sbin/lvresize >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'ln -sf /sbin/lvreduce /usr/sbin/lvreduce >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'yum -y install dhcp >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'ln -sf /etc/dhcpd.conf /etc/dhcp/dhcpd.conf >> ' . $dgiaecegcf . ' 2>&1;' );
		}
else {
			echo '
Installing KVM for RHEL 5...';
		}

		eafjejcbhg( 'echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf' );
		eafjejcbhg( 'yum install -y kvm kmod-kvm qemu libvirt python-virtinst bridge-utils >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'service libvirtd start >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'chkconfig libvirtd on >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'chkconfig NetworkManager off >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'chkconfig network on >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'service NetworkManager stop >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'echo "echo 1 > /proc/sys/net/bridge/bridge-nf-call-iptables" >> /etc/rc.local;' );
		eafjejcbhg( 'yum -y install dhcp libguestfs-* libguestfs >> ' . $dgiaecegcf . ' 2>&1;' );
	}

	function [obfuscated]() {
		global $log;
		global $filemirror;

		dbjbiaahh( '\n', '', ibdfbddch( 'cat /tmp/version.txt' ) );
		$eibaffiif = ;

		if ($eibaffiif  = '6') {
			echo '
Installing OpenVZ for RHEL 6...';
		}
else {
			echo '
Installing OpenVZ for RHEL 5...';
		}

		eafjejcbhg( 'echo "net.ipv4.ip_forward = 1" > /etc/sysctl.conf' );
		eafjejcbhg( 'echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf' );
		eafjejcbhg( 'echo "net.ipv6.conf.default.forwarding = 1" >> /etc/sysctl.conf' );
		eafjejcbhg( 'echo "net.ipv6.conf.all.forwarding = 1" >> /etc/sysctl.conf' );
		eafjejcbhg( 'echo "net.ipv4.conf.default.proxy_arp = 0" >> /etc/sysctl.conf' );
		eafjejcbhg( 'echo "net.ipv4.conf.all.rp_filter = 1" >> /etc/sysctl.conf' );
		eafjejcbhg( 'echo "kernel.sysrq = 1" >> /etc/sysctl.conf' );
		eafjejcbhg( 'echo "net.ipv4.conf.default.send_redirects = 1" >> /etc/sysctl.conf' );
		eafjejcbhg( 'echo "net.ipv4.conf.all.send_redirects = 0" >> /etc/sysctl.conf' );

		if ($eibaffiif  = '6') {
			eafjejcbhg( 'wget ' . $gcjahbefb . '/solusvm/installer/v3/openvz.repo.el6 -O /etc/yum.repos.d/openvz.repo >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'rpm --import http://download.openvz.org/RPM-GPG-Key-OpenVZ >> ' . $dgiaecegcf . ' 2>&1;' );
		}
else {
			eafjejcbhg( 'wget ' . $gcjahbefb . '/solusvm/installer/v3/openvz.repo.el5 -O /etc/yum.repos.d/openvz.repo >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'rpm --import http://download.openvz.org/RPM-GPG-Key-OpenVZ >> ' . $dgiaecegcf . ' 2>&1;' );
		}


		if (ddffdbhhcb( '/usr/lib64' )) {
			eafjejcbhg( 'yum clean all >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'yum -y install ovzkernel.x86_64 vzkernel.x86_64 vzctl vzquota gmp >> ' . $dgiaecegcf . ' 2>&1;' );
		}
else {
			eafjejcbhg( 'yum clean all >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'yum -y install ovzkernel vzkernel vzctl vzquota gmp >> ' . $dgiaecegcf . ' 2>&1;' );
		}


		if ($eibaffiif  = '6') {
			eafjejcbhg( 'wget ' . $gcjahbefb . '/solusvm/installer/v3/ve-basic.conf-sample -O /etc/vz/conf/ve-basic.conf-sample >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'wget ' . $gcjahbefb . '/solusvm/installer/v3/ve-vswap-solus.conf-sample -O /etc/vz/conf/ve-vswap-solus.conf-sample >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'wget ' . $gcjahbefb . '/solusvm/installer/v3/vz.conf -O /etc/vz/vz.conf >> ' . $dgiaecegcf . ' 2>&1;' );
		}
else {
			eafjejcbhg( 'wget ' . $gcjahbefb . '/solusvm/installer/v3/ve-basic.conf-sample -O /etc/vz/conf/ve-basic.conf-sample >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'wget ' . $gcjahbefb . '/solusvm/installer/v3/ve-vswap-solus.conf-sample -O /etc/vz/conf/ve-vswap-solus.conf-sample >> ' . $dgiaecegcf . ' 2>&1;' );
			eafjejcbhg( 'wget ' . $gcjahbefb . '/solusvm/installer/v3/vz.conf -O /etc/vz/vz.conf >> ' . $dgiaecegcf . ' 2>&1;' );
		}

		eafjejcbhg( 'service vz start >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'chkconfig vz on >> ' . $dgiaecegcf . ' 2>&1;' );
	}

	function [obfuscated]() {
		global $log;
		global $filemirror;

		echo '
Downloading Basic Templates...';
		eafjejcbhg( 'mkdir -p /vz/template/cache/ >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'mkdir -p /home/solusvm/xen/template/ >> ' . $dgiaecegcf . ' 2>&1;' );

		if (!ddffdbhhcb( '/vz/template/cache/centos-5.0-x86.tar.gz' )) {
			eafjejcbhg( 'wget ' . $gcjahbefb . '/solusvm/install/centos-5.0-x86.tar.gz -O /vz/template/cache/centos-5.0-x86.tar.gz >> ' . $dgiaecegcf . ' 2>&1;' );
		}


		if (!ddffdbhhcb( '/home/solusvm/xen/template/centos-5.3-x86.tar.gz' )) {
			eafjejcbhg( 'wget ' . $gcjahbefb . '/solusvm/install/centos-5.3-x86.tar.gz -O /home/solusvm/xen/template/centos-5.3-x86.tar.gz >> ' . $dgiaecegcf . ' 2>&1;' );
		}

	}

	function [obfuscated]() {
		$bdfjaibgdg = 51;
		$bhegahcif = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		$cgggbidheg = '';
		$beiajcjiia = 11;

		while ($beiajcjiia < $bdfjaibgdg) {
			$cgggbidheg &= $bhegahcif[cdbhidhbii( 0, cdgfjeehg( $bhegahcif ) )];
			++$beiajcjiia;
		}

		return $cgggbidheg;
	}

	function [obfuscated]() {
		global $log;
		global $nodeip;
		global $SLAVEKEY;
		global $SLAVEPASS;
		global $filemirror;

		eahddbaicg(  );
		$bgifiehbc = ;
		eahddbaicg(  );
		$bjhfdbaehg = ;
		echo '
Downloading Installation Files...';
		eafjejcbhg( 'wget ' . $gcjahbefb . '/solusvm/install/solusvm-slave-install.tar.gz -O /usr/local/solusvm/tmp/solusvm-slave-install.tar.gz >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'cp /usr/local/solusvm/tmp/extras/solusvm /etc/rc.d/init.d/solusvm >> ' . $dgiaecegcf . ' 2>&1;' . 'chown root:root /etc/rc.d/init.d/solusvm >> ' . $dgiaecegcf . ' 2>&1;' . 'chmod +x /etc/rc.d/init.d/solusvm >> ' . $dgiaecegcf . ' 2>&1;' . 'chkconfig lighttpd on >> ' . $dgiaecegcf . ' 2>&1;' . 'mkdir -p /usr/local/solusvm/data/ >> ' . $dgiaecegcf . ' 2>&1;' . 'echo "' . $bgifiehbc . ':' . $bjhfdbaehg . '" > /usr/local/solusvm/data/solusvm.conf;' );
		eafjejcbhg( 'tar xzf /usr/local/solusvm/tmp/solusvm-slave-install.tar.gz -C / >> ' . $dgiaecegcf . ' 2>&1;' . 'chown solusvm:solusvm -R /usr/local/solusvm >> ' . $dgiaecegcf . ' 2>&1;' . 'chown solusvm:solusvm -R /usr/local/solusvm/* >> ' . $dgiaecegcf . ' 2>&1;' . 'chown root:root /usr/local/solusvm/core/solusvmc-vz >> ' . $dgiaecegcf . ' 2>&1;' . 'chmod 6777 /usr/local/solusvm/core/solusvmc-vz >> ' . $dgiaecegcf . ' 2>&1;' . 'chmod 6777 /usr/local/solusvm/core/solusvmc-vz >> ' . $dgiaecegcf . ' 2>&1;' . 'chown root:root /usr/local/solusvm/core/solusvmc-node >> ' . $dgiaecegcf . ' 2>&1;' . 'chmod 6777 /usr/local/solusvm/core/solusvmc-node >> ' . $dgiaecegcf . ' 2>&1;' . 'chmod 6777 /usr/local/solusvm/core/solusvmc-node >> ' . $dgiaecegcf . ' 2>&1;' . 'chown root:root /usr/local >> ' . $dgiaecegcf . ' 2>&1;' . 'chown root:root /usr/bin/solusvmconsolevz >> ' . $dgiaecegcf . ' 2>&1;' . 'cp /usr/local/solusvm/tmp/extras/iptables-config /etc/sysconfig/iptables-config >> ' . $dgiaecegcf . ' 2>&1;' . 'chmod 6755 /usr/bin/solusvmconsolevz >> ' . $dgiaecegcf . ' 2>&1;' . 'chmod 6755 /usr/bin/solusvmconsolevz >> ' . $dgiaecegcf . ' 2>&1;' . 'yum -y update openssl >> ' . $dgiaecegcf . ' 2>&1;' . 'service lighttpd restart >> ' . $dgiaecegcf . ' 2>&1;' . 'wget ' . $gcjahbefb . '/solusvm/updates/solusvm-slave-update.tar.gz -O /usr/local/solusvm/tmp/solusvm-slave-update.tar.gz >> ' . $dgiaecegcf . ' 2>&1;' . '/bin/tar xzf /usr/local/solusvm/tmp/solusvm-slave-update.tar.gz -C /usr/local/solusvm/tmp/ >> ' . $dgiaecegcf . ' 2>&1;' . 'chmod 755 /usr/local/solusvm/tmp/update/update >> ' . $dgiaecegcf . ' 2>&1;' . '/usr/local/solusvm/tmp/update/update >> ' . $dgiaecegcf . ' 2>&1;' );
	}

	function [obfuscated]() {
		global $log;
		global $nodeip;
		global $filemirror;

		echo '
Downloading Installation Files...';
		eafjejcbhg( 'wget ' . $gcjahbefb . '/solusvm/install/solusvm-master-install.tar.gz -O /usr/local/solusvm/tmp/solusvm-master-install.tar.gz >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'wget ' . $gcjahbefb . '/solusvm/install/solusvm-bin-x86.tar.gz -O /usr/local/solusvm/tmp/solusvm-bin-x86.tar.gz >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'wget ' . $gcjahbefb . '/solusvm/install/solusvm-bin-nvirt-x86.tar.gz -O /usr/local/solusvm/tmp/solusvm-bin-nvirt-x86.tar.gz >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'cp /usr/local/solusvm/tmp/extras/solusvm /etc/rc.d/init.d/solusvm >> ' . $dgiaecegcf . ' 2>&1;' . 'chown root:root /etc/rc.d/init.d/solusvm >> ' . $dgiaecegcf . ' 2>&1;' . 'chmod +x /etc/rc.d/init.d/solusvm >> ' . $dgiaecegcf . ' 2>&1;' . 'chkconfig lighttpd on >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'yum -y install php-mcrypt >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'tar xzf /usr/local/solusvm/tmp/solusvm-master-install.tar.gz -C / >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'tar xzf /usr/local/solusvm/tmp/solusvm-bin-x86.tar.gz -C /usr/local/solusvm/core/ >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'tar xzf /usr/local/solusvm/tmp/solusvm-bin-nvirt-x86.tar.gz -C /usr/local/solusvm/core/ >> ' . $dgiaecegcf . ' 2>&1;' );
		eafjejcbhg( 'chown solusvm:solusvm -R /usr/local/solusvm >> ' . $dgiaecegcf . ' 2>&1;' . 'chown solusvm:solusvm -R /usr/local/solusvm/* >> ' . $dgiaecegcf . ' 2>&1;' . 'chown root:root /usr/local/solusvm/core/solusvmc-vz >> ' . $dgiaecegcf . ' 2>&1;' . 'chmod 6777 /usr/local/solusvm/core/solusvmc-vz >> ' . $dgiaecegcf . ' 2>&1;' . 'chmod 6777 /usr/local/solusvm/core/solusvmc-vz >> ' . $dgiaecegcf . ' 2>&1;' . 'chown root:root /usr/local/solusvm/core/solusvmc-node >> ' . $dgiaecegcf . ' 2>&1;' . 'chmod 6777 /usr/local/solusvm/core/solusvmc-node >> ' . $dgiaecegcf . ' 2>&1;' . 'chmod 6777 /usr/local/solusvm/core/solusvmc-node >> ' . $dgiaecegcf . ' 2>&1;' . 'chown root:root /usr/local/solusvm/core/solusvmc-nvirt >> ' . $dgiaecegcf . ' 2>&1;' . 'chmod 6777 /usr/local/solusvm/core/solusvmc-nvirt >> ' . $dgiaecegcf . ' 2>&1;' . 'chown root:root /usr/local >> ' . $dgiaecegcf . ' 2>&1;' . 'chown root:root /usr/bin/solusvmconsolevz >> ' . $dgiaecegcf . ' 2>&1;' . 'cp /usr/local/solusvm/tmp/extras/iptables-config /etc/sysconfig/iptables-config >> ' . $dgiaecegcf . ' 2>&1;' . 'chmod 6755 /usr/bin/solusvmconsolevz >> ' . $dgiaecegcf . ' 2>&1;' . 'chmod 6755 /usr/bin/solusvmconsolevz >> ' . $dgiaecegcf . ' 2>&1;' . 'yum -y update openssl >> ' . $dgiaecegcf . ' 2>&1;' . 'service lighttpd restart >> ' . $dgiaecegcf . ' 2>&1;' . 'php /usr/local/solusvm/system/comm.php -d --comm=systemupdate >> ' . $dgiaecegcf . ' 2>&1;' );
	}

	function [obfuscated]() {
		global $log;

		eafjejcbhg( 'cp /usr/local/solusvm/tmp/extras/lighttpd-master.conf /etc/lighttpd/lighttpd.conf >> ' . $dgiaecegcf . ' 2>&1;' . ' >> ' . $dgiaecegcf . ' 2>&1;' . 'service lighttpd start >> ' . $dgiaecegcf . ' 2>&1' );
	}

	function [obfuscated]() {
		global $log;

		eafjejcbhg( 'cp /usr/local/solusvm/tmp/extras/lighttpd-slave.conf /etc/lighttpd/lighttpd.conf >> ' . $dgiaecegcf . ' 2>&1;' . ' >> ' . $dgiaecegcf . ' 2>&1;' . 'service lighttpd start >> ' . $dgiaecegcf . ' 2>&1' );
	}

	function [obfuscated]() {
		$bdfjaibgdg = 26;
		$bhegahcif = '0123456789abcdefghijklmnopqrstuvwxyzyz';
		$cgggbidheg = '';
		$beiajcjiia = 11;

		while ($beiajcjiia < $bdfjaibgdg) {
			$cgggbidheg &= $bhegahcif[cdbhidhbii( 0, cdgfjeehg( $bhegahcif ) )];
			++$beiajcjiia;
		}

		return $cgggbidheg;
	}

	function [obfuscated]() {
		global $log;
		global $filemirror;

		echo '
Installing SSL Certificate...';
		bfcihijihi( 'hostname' );
		$dhdhhdifae = ;
		defcafjjjc(  );
		$ddhdahaji = ;
		eafjejcbhg( 'rm -r soluscert.cnf >> ' . $dgiaecegcf . ' 2>&1;' . 'touch soluscert.cnf >> ' . $dgiaecegcf . ' 2>&1;' . 'echo "[ req ]" > soluscert.cnf;' . 'echo "default_bits = 1024" >> soluscert.cnf;' . 'echo "encrypt_key = yes" >> soluscert.cnf;' . 'echo "distinguished_name = req_dn" >> soluscert.cnf;' . 'echo "x509_extensions = cert_type" >> soluscert.cnf;' . 'echo "prompt = no" >> soluscert.cnf;' . 'echo "[ req_dn ]" >> soluscert.cnf;' . 'echo "O=SolusVM Slave" >> soluscert.cnf;' . 'echo "OU=' . $ddhdahaji . '" >> soluscert.cnf;' . 'echo "CN=' . $dhdhhdifae . '" >> soluscert.cnf;' . 'echo "[ cert_type ]" >> soluscert.cnf;' . 'echo "nsCertType = server" >> soluscert.cnf;' . 'mkdir -p /usr/local/solusvm/ssl;' . 'openssl req -new -x509 -days 3652 -nodes -config soluscert.cnf \-out /usr/local/solusvm/ssl/cert.pem -keyout /usr/local/solusvm/ssl/cert.pem >> ' . $dgiaecegcf . ' 2>&1;' . 'chown solusvm:solusvm /usr/local/solusvm/ssl/cert.pem;' . 'chmod 400 /usr/local/solusvm/ssl/cert.pem;' . 'rm -f soluscert.cnf;' );
		echo '
Installing WebServer...';
		eafjejcbhg( 'wget ' . $gcjahbefb . '/solusvm/install/extras.tar.gz -O /usr/local/solusvm/tmp/extras.tar.gz >> ' . $dgiaecegcf . ' 2>&1;' . 'tar xzf /usr/local/solusvm/tmp/extras.tar.gz -C /usr/local/solusvm/tmp/ >> ' . $dgiaecegcf . ' 2>&1;' . 'mkdir -p /usr/local/solusvm/www/ >> ' . $dgiaecegcf . ' 2>&1;' . 'mkdir -p /var/run/lighttpd >> ' . $dgiaecegcf . ' 2>&1;' . 'touch /var/run/lighttpd/php-fastcgi.socket >> ' . $dgiaecegcf . ' 2>&1;' . 'chown -R solusvm:solusvm /var/run/lighttpd/ >> ' . $dgiaecegcf . ' 2>&1;' . 'chown -R solusvm:solusvm /var/log/lighttpd/ >> ' . $dgiaecegcf . ' 2>&1;' . 'yum -y install solusvm-lighttpd solusvm-lighttpd-fastcgi >> ' . $dgiaecegcf . ' 2>&1' );
		echo '
Starting WebServer...';
	}

	hgiehgdcc( 0 );
	ddcjejicei( 'display_errors', false );
	dbjbiaahh( '\n', '', ibdfbddch( 'cat /tmp/filemirror.txt' ) );
	$filemirror = $log = '/tmp/install.log';
	eafjejcbhg( 'echo "Log Started" > ' . $log . ' 2>&1' );
	echo '
Processing, please wait...';
	[obfuscated]( $argv );
	$inivar = eafjejcbhg( 'sleep 2' );
	global $log;
	global $nodeip;
	global $filemirror;

?>