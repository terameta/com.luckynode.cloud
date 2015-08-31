YUM_PATH=/usr/bin/yum
WGET_PATH=/usr/bin/wget
MKDIR_PATH=/bin/mkdir
CLEAR_PATH=/usr/bin/clear
ECHO_PATH=/bin/echo
PRINTF_PATH=/usr/bin/printf
TAR_PATH=/bin/tar
PHP_PATH=/usr/bin/php
$CLEAR_PATH
$MKDIR_PATH -p /usr/local/solusvm/tmp/
PRELOG=/tmp/preinstall.log
TMP1=/tmp/version.txt
TMP2=/tmp/type.txt
MIRROR=http://files.soluslabs.com

function _info_msg() {
_header
$ECHO_PATH " |                                                                |"
$ECHO_PATH " |    If at any point you encounter an error with installation    |"
$ECHO_PATH " |         you can refer to the following generated logs:         |"
$ECHO_PATH " |                                                                |"
$ECHO_PATH " |                      /tmp/preinstall.log                       |"
$ECHO_PATH " |                       /tmp/install.log                         |"
$ECHO_PATH " |                                                                |"
$ECHO_PATH " |          Hit [ENTER] to continue or ctrl+c to exit             |"
$ECHO_PATH " |                                                                |"
$PRINTF_PATH " o----------------------------------------------------------------o\n"	
 read entcs 
$CLEAR_PATH

}

function _master_warning() {
_header
$ECHO_PATH " |                                                                |"
$ECHO_PATH " | /!\ Warning! this installer will remove MySQL and destroy /!\  |"
$ECHO_PATH " | /!\     any databases associated with it. To quit the     /!\  |"
$ECHO_PATH " | /!\  installer press ctrl+c now or hit [ENTER] to start   /!\  |"
$ECHO_PATH " | /!\             the installation process.                 /!\  |"
$ECHO_PATH " |                                                                |"
$PRINTF_PATH " o----------------------------------------------------------------o\n"
read entcs 
$CLEAR_PATH
}
function _header() {
	$PRINTF_PATH " o----------------------------------------------------------------o\n"
	$PRINTF_PATH " | :: SolusVM Installer                       v3.4.0 (2015/02/05) |\n"
	$PRINTF_PATH " o----------------------------------------------------------------o\n"	
}
_info_msg
if [ `id -u` != "0" ]; then
$ECHO_PATH "You need to be be the root user to run this installer.\nWe also suggest you use a direct root login, not su -, sudo etc..."
exit
fi
setenforce 0 > $PRELOG 2>&1
if [ ! -e /usr/bin/yum ]; then
$ECHO_PATH " Yum not found. You must install yum first"
exit
fi
if [ -e /usr/local/solusvm/www ]; then
_header
$ECHO_PATH " |                                                                |"
$ECHO_PATH " |    /!\  SolusVM is already installed on this server!  /!\      |"
$ECHO_PATH " |                                                                |"
$ECHO_PATH " |          Hit [ENTER] to continue or ctrl+c to exit             |"
$ECHO_PATH " |                                                                |"
$PRINTF_PATH " o----------------------------------------------------------------o\n"
read entcs
fi
if [ -e /usr/local/cpanel ]; then
_header
$ECHO_PATH " |                                                                |"
$ECHO_PATH " |     /!\  cPanel is already installed on this server!  /!\      |"
$ECHO_PATH " |                                                                |"
$ECHO_PATH " |         SolusVM can't be installed on a cPanel server!         |"
$ECHO_PATH " |                                                                |"
$PRINTF_PATH " o----------------------------------------------------------------o\n"
exit;
fi 
if [ -e /usr/local/directadmin ]; then
$ECHO_PATH " |                                                                |"
$ECHO_PATH " |   /!\  DirectAdmin is already installed on this server!  /!\   |"
$ECHO_PATH " |                                                                |"
$ECHO_PATH " |       SolusVM can't be installed on a DirectAdmin server!      |"
$ECHO_PATH " |                                                                |"
$PRINTF_PATH " o----------------------------------------------------------------o\n"
exit;
fi    
$CLEAR_PATH
 _header
  $ECHO_PATH " |                                                                |"
  $ECHO_PATH " |      What Operating System is installed on this server?        |"
  $ECHO_PATH " |                                                                |"
  $ECHO_PATH " |     [1]   RHEL 5.x (RHEL 5, CentOS 5, Scientific Linux 5)      |"
  $ECHO_PATH " |     [2]   RHEL 6.x (RHEL 6, CentOS 6, Scientific Linux 6)      |"
  $ECHO_PATH " |                                                                |"
$PRINTF_PATH " o----------------------------------------------------------------o\n"
$ECHO_PATH ""	
$PRINTF_PATH "    Choose an option (1/2): "
	read version
	until [ "${version}" = "1" ] || [ "${version}" = "2" ]; do
		$PRINTF_PATH " \n Please enter a valid option: "
			read version
    done
	if [ "${version}" = "1" ]; then
$ECHO_PATH "5" > /tmp/version.txt
		elif [ "${version}" = "2" ]; then
$ECHO_PATH "6" > /tmp/version.txt
      fi
CENT_VERSION=`cat /tmp/version.txt`
$CLEAR_PATH
 _header
  $ECHO_PATH " |                                                                |"
  $ECHO_PATH " |      What version of SolusVM would you like to install?        |"
  $ECHO_PATH " |                                                                |"
  $ECHO_PATH " |      [1]   SolusVM Version 1 (latest stable version)           |"
  $ECHO_PATH " |      [-]   SolusVM Version 2 (currently unreleased)            |"
  $ECHO_PATH " |                                                                |"
$PRINTF_PATH " o----------------------------------------------------------------o\n"
$ECHO_PATH ""	
$PRINTF_PATH "    Choose an option (1): "
	read svmversion
	until [ "${svmversion}" = "1" ]; do
		$PRINTF_PATH " \n Please enter a valid option: "
			read svmversion
    done
	if [ "${version}" = "1" ]; then
$ECHO_PATH "1" > /tmp/svmversion.txt		
      fi
SVM_VERSION=`cat /tmp/svmversion.txt`
$CLEAR_PATH
 _header
  $ECHO_PATH " |                                                                |"
  $ECHO_PATH " |           What file mirror would you like to use?              |"
  $ECHO_PATH " |                                                                |"
  $ECHO_PATH " |             [1]   Automatic (Fastest Mirror)                   |"
  $ECHO_PATH " |             [2]   Europe    (France - SBG)                     |"
  $ECHO_PATH " |             [3]   Europe    (France - RBX)                     |"
  $ECHO_PATH " |             [4]   Europe    (United Kingdom)                   |"
  $ECHO_PATH " |             [5]   USA       (Texas)                            |"
  $ECHO_PATH " |             [6]   USA       (Arizona)                          |"
  $ECHO_PATH " |                                                                |"
$PRINTF_PATH " o----------------------------------------------------------------o\n"
$ECHO_PATH ""	
$PRINTF_PATH "    Choose an option (1/2/3/4/5/6): "
	read filemirror
	until [ "${filemirror}" = "1" ] || [ "${filemirror}" = "2" ] || [ "${filemirror}" = "3" ] || [ "${filemirror}" = "4" ] || [ "${filemirror}" = "5" || [ "${filemirror}" = "6" ]; do
		$PRINTF_PATH " \n Please enter a valid option: "
			read filemirror
    done
if [ "${filemirror}" = "2" ]; then
$ECHO_PATH "http://files.eu.fr.soluslabs.com" > /tmp/filemirror.txt
elif [ "${filemirror}" = "3" ]; then
$ECHO_PATH "http://files-france-rbx.solusvm.com" > /tmp/filemirror.txt
elif [ "${filemirror}" = "4" ]; then
$ECHO_PATH "http://files.eu.uk.soluslabs.com" > /tmp/filemirror.txt
elif [ "${filemirror}" = "5" ]; then
$ECHO_PATH "http://files-usa-dallas.solusvm.com" > /tmp/filemirror.txt	
elif [ "${filemirror}" = "6" ]; then
$ECHO_PATH "http://files.us.az.soluslabs.com" > /tmp/filemirror.txt	
elif [ "${filemirror}" = "1" ]; then
MIRRORLIST="/tmp/mirrorlist.txt"
$ECHO_PATH "files.eu.fr.soluslabs.com" > $MIRRORLIST
$ECHO_PATH "files.eu.uk.soluslabs.com" >> $MIRRORLIST	
$ECHO_PATH "files.us.tx.soluslabs.com" >> $MIRRORLIST
$ECHO_PATH "files.us.az.soluslabs.com" >> $MIRRORLIST
$ECHO_PATH "files-usa-dallas.solusvm.com" >> $MIRRORLIST
$ECHO_PATH "files-france-rbx.solusvm.com" >> $MIRRORLIST
BESTMIRROR="/tmp/bestmirror.txt"
rm -f $BESTMIRROR
$ECHO_PATH ""
$PRINTF_PATH " Checking fastest mirror "
while read line
do
$PRINTF_PATH "."
if [ "${line}" == "" ]; then
sleep 1
else
M=$(ping $line -B -w 2 -n -c 2 2>/dev/null | grep rtt | awk -F '/' '{print $5}')
if [ "${M}" == "" ]; then
echo 999999 $line >> $BESTMIRROR
else
echo $M $line >> $BESTMIRROR
fi
fi
done <$MIRRORLIST
BEST=`cat $BESTMIRROR | sort -n | sed -e /^$/d | head -1 | awk '{print $2}'`    
$ECHO_PATH "http://$BEST" > /tmp/filemirror.txt	
$ECHO_PATH ""
$ECHO_PATH " Using $BEST"
sleep 3
      fi
MIRROR=`cat /tmp/filemirror.txt`
$CLEAR_PATH
 _header
$ECHO_PATH " |                                                                |"
$ECHO_PATH " |         What SolusVM type would you like to install?           |"
$ECHO_PATH " |                                                                |"
$ECHO_PATH " |           [1]   Master With No Virtualization                  |"
$ECHO_PATH " |           [2]   Master With OpenVZ Virtualization              |"
$ECHO_PATH " |                                                                |"
$ECHO_PATH " |           [3]   Slave With No Virtualization                   |"
$ECHO_PATH " |           [4]   Slave With OpenVZ Virtualization               |"
$ECHO_PATH " |           [5]   Slave With Xen Virtualization                  |"
$ECHO_PATH " |           [6]   Slave With KVM Virtualization                  |"
$ECHO_PATH " |                                                                |"
$ECHO_PATH " |   If you don't want to include the default os templates you    |"
$ECHO_PATH " |   may use the 'no' flag in your option. i.e 1no, 2no etc...    |"
$ECHO_PATH " |                                                                |"
$PRINTF_PATH " o----------------------------------------------------------------o\n"	
$ECHO_PATH ""
printf "    Choose an option (1/1no/2/2no/3/3no/4/4no/5/5no/6/6no): "
        read option
        until [ "${option}" = "1" ] || [ "${option}" = "2" ] || [ "${option}" = "3" ] || [ "${option}" = "4" ] || [ "${option}" = "5" ] || [ "${option}" = "6" ] || [ "${option}" = "1no" ] || [ "${option}" = "2no" ] || [ "${option}" = "3no" ] || [ "${option}" = "4no" ] || [ "${option}" = "5no" ] || [ "${option}" = "6no" ]; do
                $PRINTF_PATH " \n Please enter a valid option: "
                        read option
    done

     if [ "${CENT_VERSION}" = "5" ]; then
	 $ECHO_PATH ""
	 $ECHO_PATH "Please Wait, Installing Dependencies for RHEL 5...";
$YUM_PATH -y install glibc glibc-devel glibc-devel.i686 perl php php-cli php-common >> $PRELOG 2>&1
			   else
$ECHO_PATH ""				
$ECHO_PATH "Please Wait, Installing Dependencies for RHEL 6...";
$YUM_PATH -y install glibc glibc-devel glibc-devel.i686 perl php php-cli php-common >> $PRELOG 2>&1 
      fi  
if [ -d /usr/lib64 ]; then
#64 bit
$WGET_PATH $MIRROR/solusvm/loaders/ioncube_loaders_lin_x86_64.tar.gz -O /usr/local/solusvm/tmp/ioncube_loaders.tar.gz >> $PRELOG 2>&1
$WGET_PATH $MIRROR/solusvm/loaders/php.ini.64.${CENT_VERSION} -O /etc/php.ini >> $PRELOG 2>&1
else
#32bit
$WGET_PATH $MIRROR/solusvm/loaders/ioncube_loaders_lin_x86.tar.gz -O /usr/local/solusvm/tmp/ioncube_loaders.tar.gz >> $PRELOG 2>&1
$WGET_PATH $MIRROR/solusvm/loaders/php.ini.32.${CENT_VERSION} -O /etc/php.ini >> $PRELOG 2>&1
fi  	  
userdel solusvm >> $PRELOG 2>&1
adduser -d /usr/local/solusvm -s /sbin/nologin solusvm >> $PRELOG 2>&1
$WGET_PATH http://repo.soluslabs.com/centos/soluslabs.repo -O /etc/yum.repos.d/soluslabs.repo >> $PRELOG 2>&1
$YUM_PATH clean all >> $PRELOG 2>&1

$TAR_PATH vxzf /usr/local/solusvm/tmp/ioncube_loaders.tar.gz -C /etc/ >> $PRELOG 2>&1

$WGET_PATH $MIRROR/solusvm/installer/v3/installscripts.tar.gz -O /usr/local/solusvm/tmp/installscripts.tar.gz >> $PRELOG 2>&1
$MKDIR_PATH -p /usr/local/solusvm/tmp/.install/
$TAR_PATH vxzf /usr/local/solusvm/tmp/installscripts.tar.gz -C /usr/local/solusvm/tmp/.install/ >> $PRELOG 2>&1
chown root:root /usr/local/solusvm/tmp/.install/*
chmod +x /usr/local/solusvm/tmp/.install/*

if [ "${option}" = "1" ]; then
$CLEAR_PATH
_master_warning
$CLEAR_PATH
$PHP_PATH /usr/local/solusvm/tmp/.install/master --virt=none
elif [ "${option}" = "2" ]; then
$CLEAR_PATH
_master_warning
$CLEAR_PATH
$PHP_PATH /usr/local/solusvm/tmp/.install/master --virt=openvz
elif [ "${option}" = "3" ]; then
$CLEAR_PATH
$PHP_PATH /usr/local/solusvm/tmp/.install/slave --virt=none
elif [ "${option}" = "4" ]; then
$CLEAR_PATH
$PHP_PATH /usr/local/solusvm/tmp/.install/slave --virt=openvz
elif [ "${option}" = "5" ]; then
$CLEAR_PATH
$PHP_PATH /usr/local/solusvm/tmp/.install/slave --virt=xen
elif [ "${option}" = "6" ]; then
$CLEAR_PATH
$PHP_PATH /usr/local/solusvm/tmp/.install/slave --virt=kvm
elif [ "${option}" = "1no" ]; then
$CLEAR_PATH
_master_warning
$CLEAR_PATH
$PHP_PATH /usr/local/solusvm/tmp/.install/master --virt=none --templates=none
elif [ "${option}" = "2no" ]; then
$CLEAR_PATH
_master_warning
$CLEAR_PATH
$PHP_PATH /usr/local/solusvm/tmp/.install/master --virt=openvz --templates=none
elif [ "${option}" = "3no" ]; then
$CLEAR_PATH
$PHP_PATH /usr/local/solusvm/tmp/.install/slave --virt=none --templates=none
elif [ "${option}" = "4no" ]; then
$CLEAR_PATH
$PHP_PATH /usr/local/solusvm/tmp/.install/slave --virt=openvz --templates=none
elif [ "${option}" = "5no" ]; then
$CLEAR_PATH
$PHP_PATH /usr/local/solusvm/tmp/.install/slave --virt=xen --templates=none
elif [ "${option}" = "6no" ]; then
$CLEAR_PATH
$PHP_PATH /usr/local/solusvm/tmp/.install/slave --virt=kvm --templates=none
      fi
                