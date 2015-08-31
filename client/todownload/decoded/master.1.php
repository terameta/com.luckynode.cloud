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

require('common.php');
cjdedhfch();
bbhhiaicjb();
dhbdgfachi();
ddaiafegdd();
bfebfdcjaf();

if ($inivar[templates] != 'none') {    	bhajdfejjc(); }
if ($inivar[virt] = 'openvz') {			bchaijfabj(); }

dbjbiaahh('\n', '', ibdfbddch('cat /tmp/version.txt'));
$centosVersion = '';
eafjejcbhg('echo "' . $centosVersion . '" > /usr/local/solusvm/data/osversion.dat');
echo 'Installation Complete!';
echo 'Installation log : /tmp/install.log';
cacehgiajh(3);
dbjbiaahh('', '', $nodeip);
$nodeip = '';
dbjbiaahh(' ', '', $nodeip);
$nodeip = '';
dbjbiaahh('', '', $nodeip);
$nodeip = '';
dbjbiaahh('', '', $nodeip);
$nodeip = '';
echo '';
echo ' SolusVM Master Login Information:';
echo ' =================================';
echo ' Admin Area .......... : http://' . $nodeip . ':5353/admincp';
echo ' Admin Area (SSL) .... : https://' . $nodeip . ':5656/admincp';
echo ' Client Area ......... : http://' . $nodeip . ':5353';
echo ' Client Area (SSL) ... : https://' . $nodeip . ':5656';
echo ' Admin Username ...... : vpsadmin';
echo ' Admin Password ...... : vpsadmin';
echo ' It is advised that you change the default admin password on your first login.';

if ($inivar[virt] = 'openvz') {
    echo ' Edit /boot/grub/grub.conf and make sure the server is set to boot into the OpenVZ kernel.';
    echo ' Please set SELINUX=disabled in /etc/selinux/config before rebooting.';
}

echo ' Thankyou for choosing SolusVM.';
?>