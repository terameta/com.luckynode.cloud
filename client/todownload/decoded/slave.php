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

	require( 'common.php' );
	cjdedhfch(  );
	bbhhiaicjb(  );
	bcehcjfhdf(  );
	ijgaadhij(  );

	if ($inivar[templates] != 'none') {
		bhajdfejjc(  );
	}


	if ($inivar[virt]  = 'openvz') {
		bchaijfabj(  );
	}


	if ($inivar[virt]  = 'xen') {
		digbbcajef(  );
	}


	if ($inivar[virt]  = 'kvm') {
		bbcgdeiced(  );
	}

	dbjbiaahh( '\n', '', ibdfbddch( 'cat /tmp/version.txt' ) );
	$centosVersion = ;
	eafjejcbhg( 'echo "' . $centosVersion . '" > /usr/local/solusvm/data/osversion.dat' );
	echo '
Installation Complete!';
	echo '

Installation log : /tmp/install.log
';
	cacehgiajh( 3 );
	dbjbiaahh( '
', '', $nodeip );
	$nodeip = ;
	dbjbiaahh( ' ', '', $nodeip );
	$nodeip = ;
	dbjbiaahh( '', '', $nodeip );
	$nodeip = ;
	dbjbiaahh( '
', '', $nodeip );
	$nodeip = ;
	echo '
';
	echo ' Add this slave to your SolusVM master using the following details:
';
	echo '
';
	echo ' ID Key .......... : ' . $SLAVEKEY . '
';
	echo ' ID Password ..... : ' . $SLAVEPASS . '
';

	if ($inivar[virt]  = 'openvz') {
		echo ' 
Edit /boot/grub/grub.conf and make sure the server is set to boot into the OpenVZ kernel.
';
		echo ' Please set SELINUX=disabled in /etc/selinux/config before rebooting.

';
	}


	if ($inivar[virt]  = 'xen') {
		echo ' 
Edit /boot/grub/grub.conf and make sure the server is set to boot into the Xen kernel.
';
		echo ' 
Important!! Please read the following: https://documentation.solusvm.com/display/DOCS/Xen+XL+Setup
';
		echo ' 
Run this command once rebooted: php /usr/local/solusvm/includes/xenkernel.php .
';
		echo ' Please set SELINUX=disabled in /etc/selinux/config before rebooting.

';
	}


	if ($inivar[virt]  = 'kvm') {
		echo ' 
IMPORTANT!! You need to setup a network bridge before you can use KVM on this server.
';
		echo ' Please see the following link: http://wiki.solusvm.com/index.php/KVM_Network_Bridge_Setup

';
		echo ' Please set SELINUX=disabled in /etc/selinux/config before rebooting.

';
	}

	echo ' 
Thankyou for choosing SolusVM.

';
?>