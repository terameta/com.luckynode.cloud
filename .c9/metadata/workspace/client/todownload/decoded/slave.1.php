{"filter":false,"title":"slave.1.php","tooltip":"/client/todownload/decoded/slave.1.php","undoManager":{"mark":82,"position":82,"stack":[[{"start":{"row":0,"column":0},"end":{"row":111,"column":2},"action":"remove","lines":["<?php","/**","*","* @ IonCube Priv8 Decoder V1 By H@CK3R $2H  ","*","* @ Version  : 1","* @ Author   : H@CK3R $2H  ","* @ Release on : 14-Feb-2014","* @ Email  : Hacker.S2h@Gmail.com","*","**/","","\trequire( 'common.php' );","\tcjdedhfch(  );","\tbbhhiaicjb(  );","\tbcehcjfhdf(  );","\tijgaadhij(  );","","\tif ($inivar[templates] != 'none') {","\t\tbhajdfejjc(  );","\t}","","","\tif ($inivar[virt]  = 'openvz') {","\t\tbchaijfabj(  );","\t}","","","\tif ($inivar[virt]  = 'xen') {","\t\tdigbbcajef(  );","\t}","","","\tif ($inivar[virt]  = 'kvm') {","\t\tbbcgdeiced(  );","\t}","","\tdbjbiaahh( '\\n', '', ibdfbddch( 'cat /tmp/version.txt' ) );","\t$centosVersion = ;","\teafjejcbhg( 'echo \"' . $centosVersion . '\" > /usr/local/solusvm/data/osversion.dat' );","\techo '","Installation Complete!';","\techo '","","Installation log : /tmp/install.log","';","\tcacehgiajh( 3 );","\tdbjbiaahh( '","', '', $nodeip );","\t$nodeip = ;","\tdbjbiaahh( ' ', '', $nodeip );","\t$nodeip = ;","\tdbjbiaahh( '","', '', $nodeip );","\t$nodeip = ;","\tdbjbiaahh( '","', '', $nodeip );","\t$nodeip = ;","\techo '","';","\techo ' Add this slave to your SolusVM master using the following details:","';","\techo '","';","\techo ' ID Key .......... : ' . $SLAVEKEY . '","';","\techo ' ID Password ..... : ' . $SLAVEPASS . '","';","","\tif ($inivar[virt]  = 'openvz') {","\t\techo ' ","Edit /boot/grub/grub.conf and make sure the server is set to boot into the OpenVZ kernel.","';","\t\techo ' Please set SELINUX=disabled in /etc/selinux/config before rebooting.","","';","\t}","","","\tif ($inivar[virt]  = 'xen') {","\t\techo ' ","Edit /boot/grub/grub.conf and make sure the server is set to boot into the Xen kernel.","';","\t\techo ' ","Important!! Please read the following: https://documentation.solusvm.com/display/DOCS/Xen+XL+Setup","';","\t\techo ' ","Run this command once rebooted: php /usr/local/solusvm/includes/xenkernel.php .","';","\t\techo ' Please set SELINUX=disabled in /etc/selinux/config before rebooting.","","';","\t}","","","\tif ($inivar[virt]  = 'kvm') {","\t\techo ' ","IMPORTANT!! You need to setup a network bridge before you can use KVM on this server.","';","\t\techo ' Please see the following link: http://wiki.solusvm.com/index.php/KVM_Network_Bridge_Setup","","';","\t\techo ' Please set SELINUX=disabled in /etc/selinux/config before rebooting.","","';","\t}","","\techo ' ","Thankyou for choosing SolusVM.","","';","?>"],"id":2},{"start":{"row":0,"column":0},"end":{"row":111,"column":2},"action":"insert","lines":["<?php","/**"," *"," * @ IonCube Priv8 Decoder V1 By H@CK3R $2H  "," *"," * @ Version  : 1"," * @ Author   : H@CK3R $2H  "," * @ Release on : 14-Feb-2014"," * @ Email  : Hacker.S2h@Gmail.com"," *"," **/","","require('common.php');","cjdedhfch();","bbhhiaicjb();","bcehcjfhdf();","ijgaadhij();","","if ($inivar[templates] != 'none') {","    bhajdfejjc();","}","","","if ($inivar[virt] = 'openvz') {","    bchaijfabj();","}","","","if ($inivar[virt] = 'xen') {","    digbbcajef();","}","","","if ($inivar[virt] = 'kvm') {","    bbcgdeiced();","}","","dbjbiaahh('\\n', '', ibdfbddch('cat /tmp/version.txt'));","$centosVersion = '';","eafjejcbhg('echo \"' . $centosVersion . '\" > /usr/local/solusvm/data/osversion.dat');","echo '","Installation Complete!';","echo '","","Installation log : /tmp/install.log","';","cacehgiajh(3);","dbjbiaahh('","', '', $nodeip);","$nodeip = '';","dbjbiaahh(' ', '', $nodeip);","$nodeip = '';","dbjbiaahh('","', '', $nodeip);","$nodeip = '';","dbjbiaahh('","', '', $nodeip);","$nodeip = '';","echo '","';","echo ' Add this slave to your SolusVM master using the following details:","';","echo '","';","echo ' ID Key .......... : ' . $SLAVEKEY . '","';","echo ' ID Password ..... : ' . $SLAVEPASS . '","';","","if ($inivar[virt] = 'openvz') {","    echo ' ","Edit /boot/grub/grub.conf and make sure the server is set to boot into the OpenVZ kernel.","';","    echo ' Please set SELINUX=disabled in /etc/selinux/config before rebooting.","","';","}","","","if ($inivar[virt] = 'xen') {","    echo ' ","Edit /boot/grub/grub.conf and make sure the server is set to boot into the Xen kernel.","';","    echo ' ","Important!! Please read the following: https://documentation.solusvm.com/display/DOCS/Xen+XL+Setup","';","    echo ' ","Run this command once rebooted: php /usr/local/solusvm/includes/xenkernel.php .","';","    echo ' Please set SELINUX=disabled in /etc/selinux/config before rebooting.","","';","}","","","if ($inivar[virt] = 'kvm') {","    echo ' ","IMPORTANT!! You need to setup a network bridge before you can use KVM on this server.","';","    echo ' Please see the following link: http://wiki.solusvm.com/index.php/KVM_Network_Bridge_Setup","","';","    echo ' Please set SELINUX=disabled in /etc/selinux/config before rebooting.","","';","}","","echo ' ","Thankyou for choosing SolusVM.","","';","?>"]}],[{"start":{"row":18,"column":35},"end":{"row":19,"column":0},"action":"remove","lines":["",""],"id":3}],[{"start":{"row":18,"column":52},"end":{"row":19,"column":0},"action":"remove","lines":["",""],"id":4}],[{"start":{"row":18,"column":52},"end":{"row":18,"column":53},"action":"insert","lines":[" "],"id":5}],[{"start":{"row":19,"column":0},"end":{"row":20,"column":0},"action":"remove","lines":["",""],"id":6}],[{"start":{"row":19,"column":0},"end":{"row":20,"column":0},"action":"remove","lines":["",""],"id":7}],[{"start":{"row":19,"column":31},"end":{"row":20,"column":0},"action":"remove","lines":["",""],"id":8}],[{"start":{"row":19,"column":48},"end":{"row":20,"column":0},"action":"remove","lines":["",""],"id":9}],[{"start":{"row":19,"column":49},"end":{"row":20,"column":0},"action":"remove","lines":["",""],"id":10}],[{"start":{"row":19,"column":49},"end":{"row":20,"column":0},"action":"remove","lines":["",""],"id":11}],[{"start":{"row":20,"column":28},"end":{"row":21,"column":0},"action":"remove","lines":["",""],"id":12}],[{"start":{"row":20,"column":45},"end":{"row":21,"column":0},"action":"remove","lines":["",""],"id":13}],[{"start":{"row":19,"column":35},"end":{"row":19,"column":36},"action":"insert","lines":["\t"],"id":14}],[{"start":{"row":19,"column":36},"end":{"row":19,"column":37},"action":"insert","lines":["\t"],"id":15}],[{"start":{"row":18,"column":39},"end":{"row":18,"column":40},"action":"insert","lines":["\t"],"id":16}],[{"start":{"row":20,"column":32},"end":{"row":20,"column":33},"action":"insert","lines":["\t"],"id":17}],[{"start":{"row":20,"column":33},"end":{"row":20,"column":34},"action":"insert","lines":["\t"],"id":18}],[{"start":{"row":19,"column":50},"end":{"row":19,"column":51},"action":"insert","lines":[" "],"id":19}],[{"start":{"row":20,"column":47},"end":{"row":20,"column":48},"action":"insert","lines":[" "],"id":20}],[{"start":{"row":21,"column":0},"end":{"row":22,"column":0},"action":"remove","lines":["",""],"id":21}],[{"start":{"row":21,"column":0},"end":{"row":22,"column":0},"action":"remove","lines":["",""],"id":22}],[{"start":{"row":21,"column":28},"end":{"row":22,"column":0},"action":"remove","lines":["",""],"id":23}],[{"start":{"row":21,"column":28},"end":{"row":21,"column":29},"action":"remove","lines":[" "],"id":24}],[{"start":{"row":21,"column":28},"end":{"row":21,"column":29},"action":"remove","lines":[" "],"id":25}],[{"start":{"row":21,"column":28},"end":{"row":21,"column":29},"action":"remove","lines":[" "],"id":26}],[{"start":{"row":21,"column":28},"end":{"row":21,"column":29},"action":"remove","lines":[" "],"id":27}],[{"start":{"row":21,"column":28},"end":{"row":21,"column":29},"action":"insert","lines":["\t"],"id":28}],[{"start":{"row":21,"column":29},"end":{"row":21,"column":30},"action":"insert","lines":["\t"],"id":29}],[{"start":{"row":21,"column":30},"end":{"row":21,"column":31},"action":"insert","lines":["\t"],"id":30}],[{"start":{"row":21,"column":44},"end":{"row":22,"column":0},"action":"remove","lines":["",""],"id":31}],[{"start":{"row":21,"column":44},"end":{"row":21,"column":45},"action":"insert","lines":[" "],"id":32}],[{"start":{"row":26,"column":6},"end":{"row":27,"column":0},"action":"remove","lines":["",""],"id":33}],[{"start":{"row":27,"column":6},"end":{"row":28,"column":0},"action":"remove","lines":["",""],"id":34}],[{"start":{"row":27,"column":6},"end":{"row":28,"column":0},"action":"remove","lines":["",""],"id":35}],[{"start":{"row":27,"column":41},"end":{"row":28,"column":0},"action":"remove","lines":["",""],"id":36}],[{"start":{"row":29,"column":11},"end":{"row":30,"column":0},"action":"remove","lines":["",""],"id":37}],[{"start":{"row":33,"column":11},"end":{"row":34,"column":0},"action":"remove","lines":["",""],"id":38}],[{"start":{"row":35,"column":11},"end":{"row":36,"column":0},"action":"remove","lines":["",""],"id":39}],[{"start":{"row":37,"column":6},"end":{"row":38,"column":0},"action":"remove","lines":["",""],"id":40}],[{"start":{"row":38,"column":6},"end":{"row":38,"column":7},"action":"remove","lines":[" "],"id":41}],[{"start":{"row":38,"column":72},"end":{"row":39,"column":0},"action":"remove","lines":["",""],"id":42}],[{"start":{"row":39,"column":6},"end":{"row":40,"column":0},"action":"remove","lines":["",""],"id":43}],[{"start":{"row":40,"column":6},"end":{"row":40,"column":7},"action":"remove","lines":[" "],"id":44}],[{"start":{"row":40,"column":43},"end":{"row":41,"column":0},"action":"remove","lines":["",""],"id":45}],[{"start":{"row":41,"column":6},"end":{"row":41,"column":7},"action":"remove","lines":[" "],"id":46}],[{"start":{"row":41,"column":44},"end":{"row":42,"column":0},"action":"remove","lines":["",""],"id":47}],[{"start":{"row":42,"column":0},"end":{"row":43,"column":0},"action":"insert","lines":["",""],"id":48}],[{"start":{"row":44,"column":31},"end":{"row":45,"column":0},"action":"remove","lines":["",""],"id":49}],[{"start":{"row":44,"column":31},"end":{"row":44,"column":35},"action":"remove","lines":["    "],"id":50},{"start":{"row":44,"column":31},"end":{"row":45,"column":0},"action":"insert","lines":["",""]}],[{"start":{"row":45,"column":0},"end":{"row":45,"column":1},"action":"insert","lines":["\t"],"id":51}],[{"start":{"row":45,"column":8},"end":{"row":46,"column":0},"action":"remove","lines":["",""],"id":52}],[{"start":{"row":45,"column":7},"end":{"row":45,"column":8},"action":"remove","lines":[" "],"id":53}],[{"start":{"row":45,"column":96},"end":{"row":46,"column":0},"action":"remove","lines":["",""],"id":54}],[{"start":{"row":45,"column":98},"end":{"row":46,"column":0},"action":"remove","lines":["",""],"id":55}],[{"start":{"row":45,"column":98},"end":{"row":45,"column":102},"action":"remove","lines":["    "],"id":56},{"start":{"row":45,"column":98},"end":{"row":46,"column":0},"action":"insert","lines":["",""]},{"start":{"row":46,"column":0},"end":{"row":46,"column":1},"action":"insert","lines":["\t"]}],[{"start":{"row":46,"column":76},"end":{"row":47,"column":0},"action":"remove","lines":["",""],"id":57}],[{"start":{"row":46,"column":76},"end":{"row":47,"column":0},"action":"remove","lines":["",""],"id":58}],[{"start":{"row":51,"column":11},"end":{"row":52,"column":0},"action":"remove","lines":["",""],"id":59}],[{"start":{"row":51,"column":10},"end":{"row":51,"column":11},"action":"remove","lines":[" "],"id":60}],[{"start":{"row":51,"column":96},"end":{"row":52,"column":0},"action":"remove","lines":["",""],"id":61}],[{"start":{"row":51,"column":98},"end":{"row":52,"column":0},"action":"remove","lines":["",""],"id":62}],[{"start":{"row":51,"column":98},"end":{"row":51,"column":102},"action":"remove","lines":["    "],"id":63},{"start":{"row":51,"column":98},"end":{"row":52,"column":0},"action":"insert","lines":["",""]},{"start":{"row":52,"column":0},"end":{"row":52,"column":4},"action":"insert","lines":["    "]}],[{"start":{"row":52,"column":11},"end":{"row":53,"column":0},"action":"remove","lines":["",""],"id":64}],[{"start":{"row":52,"column":10},"end":{"row":52,"column":11},"action":"remove","lines":[" "],"id":65}],[{"start":{"row":52,"column":108},"end":{"row":53,"column":0},"action":"remove","lines":["",""],"id":66}],[{"start":{"row":52,"column":110},"end":{"row":53,"column":0},"action":"remove","lines":["",""],"id":67}],[{"start":{"row":52,"column":110},"end":{"row":52,"column":114},"action":"remove","lines":["    "],"id":68},{"start":{"row":52,"column":110},"end":{"row":53,"column":0},"action":"insert","lines":["",""]},{"start":{"row":53,"column":0},"end":{"row":53,"column":4},"action":"insert","lines":["    "]}],[{"start":{"row":53,"column":11},"end":{"row":54,"column":0},"action":"remove","lines":["",""],"id":69}],[{"start":{"row":53,"column":10},"end":{"row":53,"column":11},"action":"remove","lines":[" "],"id":70}],[{"start":{"row":53,"column":89},"end":{"row":54,"column":0},"action":"remove","lines":["",""],"id":71}],[{"start":{"row":54,"column":10},"end":{"row":54,"column":11},"action":"remove","lines":[" "],"id":72}],[{"start":{"row":54,"column":78},"end":{"row":55,"column":0},"action":"remove","lines":["",""],"id":73}],[{"start":{"row":54,"column":78},"end":{"row":55,"column":0},"action":"remove","lines":["",""],"id":74}],[{"start":{"row":59,"column":10},"end":{"row":59,"column":11},"action":"remove","lines":[" "],"id":75}],[{"start":{"row":59,"column":10},"end":{"row":60,"column":0},"action":"remove","lines":["",""],"id":76}],[{"start":{"row":61,"column":10},"end":{"row":61,"column":11},"action":"remove","lines":[" "],"id":77}],[{"start":{"row":64,"column":10},"end":{"row":64,"column":11},"action":"remove","lines":[" "],"id":78}],[{"start":{"row":59,"column":95},"end":{"row":60,"column":0},"action":"remove","lines":["",""],"id":79}],[{"start":{"row":60,"column":99},"end":{"row":61,"column":0},"action":"remove","lines":["",""],"id":80}],[{"start":{"row":60,"column":99},"end":{"row":61,"column":0},"action":"remove","lines":["",""],"id":81}],[{"start":{"row":61,"column":78},"end":{"row":62,"column":0},"action":"remove","lines":["",""],"id":82}],[{"start":{"row":61,"column":78},"end":{"row":62,"column":0},"action":"remove","lines":["",""],"id":83}],[{"start":{"row":3,"column":43},"end":{"row":3,"column":45},"action":"remove","lines":["  "],"id":84},{"start":{"row":6,"column":26},"end":{"row":6,"column":28},"action":"remove","lines":["  "]},{"start":{"row":64,"column":6},"end":{"row":64,"column":7},"action":"remove","lines":[" "]}]]},"ace":{"folds":[],"scrolltop":540,"scrollleft":0,"selection":{"start":{"row":61,"column":78},"end":{"row":61,"column":78},"isBackwards":false},"options":{"tabSize":4,"useSoftTabs":false,"guessTabSize":false,"useWrapMode":false,"wrapToView":true},"firstLineState":{"row":37,"state":"php-start","mode":"ace/mode/php"}},"timestamp":1435039059466,"hash":"097de8f312c23a7e48484baa865d25eedb7ab3fd"}