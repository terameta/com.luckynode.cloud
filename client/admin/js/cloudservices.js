var cloudServices = angular.module('cloudServices', ['ngResource']);

cloudServices.service('$userService', ['$resource', '$q', '$rootScope', '$localStorage', '$http',
    function userService($resource, $q, $rootScope, $localStorage, $http) {
        var service = {};

        service.signin = signin;
        service.signout = signout;

        return service;

        function signin(username, password) {
            var deferred = $q.defer();
            var signinParams = {
                email: username,
                pass: password
            };
            if(username && password) {
            	$http.post('/api/users/authenticate', signinParams).
            	success(function(data, status, headers, config) {
            		$rootScope.apiToken = data.token;
            		$localStorage.set('apiToken', data.token);
            		deferred.resolve(data);
            	}).
            	error(function(data, status, headers, config) {
            		deferred.reject(data);
            	});
            }
            else {
            	deferred.reject("No username/password");
            }
            return deferred.promise;
        }

        function signout() {
            var deferred = $q.defer();
            $rootScope.apiToken = undefined;
            $localStorage.remove('apiToken');
            deferred.resolve();
            return deferred.promise;
        }
    }
]);

cloudServices.service('$signinModal', function($uibModal, $rootScope, $localStorage, $timeout) {

    function assignCurrentUser(data) {
        $rootScope.apiToken = data.token;
        $localStorage.set('apiToken', data.token);
        return data;
    }

    return function() {
        var instance = $uibModal.open({
            templateUrl: '/admin/partials/authentication/signinModal.html',
            controller: 'signinModalController',
            controllerAs: 'signinModalController'
        });

        return instance.result.then(assignCurrentUser);
    };

});

cloudServices.service('$localStorage', function localStorage($window) {
    var localStorageService = {};
    localStorageService.set = set;
    localStorageService.get = get;
    localStorageService.setObject = setObject;
    localStorageService.getObject = getObject;
    localStorageService.remove = remove;

    function set(key, value) {
        $window.localStorage[key] = value;
    }

    function get(key, defaultValue) {
        return $window.localStorage[key] || defaultValue;
    }

    function setObject(key, value) {
        $window.localStorage[key] = JSON.stringify(value);
    }

    function getObject(key) {
        return JSON.parse($window.localStorage[key] || '{}');
    }

    function remove(key) {
        $window.localStorage.removeItem(key);
        return 1;
    }

    return localStorageService;
});

cloudServices.service('srvcLocations', function locations(){
	var countries = [
		{name:'Afghanistan', phoneCode:'93', code: 'AF', code3:'AFG'},
		{name:'Albania', phoneCode:'355', code: 'AL', code3:'ALB'},
		{name:'Algeria', phoneCode:'213', code: 'DZ', code3:'DZA'},
		{name:'American Samoa', phoneCode:'1-684', code: 'AS', code3:'ASM'},
		{name:'Andorra', phoneCode:'376', code: 'AD', code3:'AND'},
		{name:'Angola', phoneCode:'244', code: 'AO', code3:'AGO'},
		{name:'Anguilla', phoneCode:'1-264', code: 'AI', code3:'AIA'},
		{name:'Antarctica', phoneCode:'672', code: 'AQ', code3:'ATA'},
		{name:'Antigua and Barbuda', phoneCode:'1-268', code: 'AG', code3:'ATG'},
		{name:'Argentina', phoneCode:'54', code: 'AR', code3:'ARG'},
		{name:'Armenia', phoneCode:'374', code: 'AM', code3:'ARM'},
		{name:'Aruba', phoneCode:'297', code: 'AW', code3:'ABW'},
		{name:'Australia', phoneCode:'61', code: 'AU', code3:'AUS'},
		{name:'Austria', phoneCode:'43', code: 'AT', code3:'AUT'},
		{name:'Azerbaijan', phoneCode:'994', code: 'AZ', code3:'AZE'},
		{name:'Bahamas', phoneCode:'1-242', code: 'BS', code3:'BHS'},
		{name:'Bahrain', phoneCode:'973', code: 'BH', code3:'BHR'},
		{name:'Bangladesh', phoneCode:'880', code: 'BD', code3:'BGD'},
		{name:'Barbados', phoneCode:'1-246', code: 'BB', code3:'BRB'},
		{name:'Belarus', phoneCode:'375', code: 'BY', code3:'BLR'},
		{name:'Belgium', phoneCode:'32', code: 'BE', code3:'BEL'},
		{name:'Belize', phoneCode:'501', code: 'BZ', code3:'BLZ'},
		{name:'Benin', phoneCode:'229', code: 'BJ', code3:'BEN'},
		{name:'Bermuda', phoneCode:'1-441', code: 'BM', code3:'BMU'},
		{name:'Bhutan', phoneCode:'975', code: 'BT', code3:'BTN'},
		{name:'Bolivia', phoneCode:'591', code: 'BO', code3:'BOL'},
		{name:'Bosnia and Herzegovina', phoneCode:'387', code: 'BA', code3:'BIH'},
		{name:'Botswana', phoneCode:'267', code: 'BW', code3:'BWA'},
		{name:'Brazil', phoneCode:'55', code: 'BR', code3:'BRA'},
		{name:'British Indian Ocean Territory', phoneCode:'246', code: 'IO', code3:'IOT'},
		{name:'British Virgin Islands', phoneCode:'1-284', code: 'VG', code3:'VGB'},
		{name:'Brunei', phoneCode:'673', code: 'BN', code3:'BRN'},
		{name:'Bulgaria', phoneCode:'359', code: 'BG', code3:'BGR'},
		{name:'Burkina Faso', phoneCode:'226', code: 'BF', code3:'BFA'},
		{name:'Burundi', phoneCode:'257', code: 'BI', code3:'BDI'},
		{name:'Cambodia', phoneCode:'855', code: 'KH', code3:'KHM'},
		{name:'Cameroon', phoneCode:'237', code: 'CM', code3:'CMR'},
		{name:'Canada', phoneCode:'1', code: 'CA', code3:'CAN'},
		{name:'Cape Verde', phoneCode:'238', code: 'CV', code3:'CPV'},
		{name:'Cayman Islands', phoneCode:'1-345', code: 'KY', code3:'CYM'},
		{name:'Central African Republic', phoneCode:'236', code: 'CF', code3:'CAF'},
		{name:'Chad', phoneCode:'235', code: 'TD', code3:'TCD'},
		{name:'Chile', phoneCode:'56', code: 'CL', code3:'CHL'},
		{name:'China', phoneCode:'86', code: 'CN', code3:'CHN'},
		{name:'Christmas Island', phoneCode:'61', code: 'CX', code3:'CXR'},
		{name:'Cocos Islands', phoneCode:'61', code: 'CC', code3:'CCK'},
		{name:'Colombia', phoneCode:'57', code: 'CO', code3:'COL'},
		{name:'Comoros', phoneCode:'269', code: 'KM', code3:'COM'},
		{name:'Cook Islands', phoneCode:'682', code: 'CK', code3:'COK'},
		{name:'Costa Rica', phoneCode:'506', code: 'CR', code3:'CRI'},
		{name:'Croatia', phoneCode:'385', code: 'HR', code3:'HRV'},
		{name:'Cuba', phoneCode:'53', code: 'CU', code3:'CUB'},
		{name:'Curacao', phoneCode:'599', code: 'CW', code3:'CUW'},
		{name:'Cyprus', phoneCode:'357', code: 'CY', code3:'CYP'},
		{name:'Czech Republic', phoneCode:'420', code: 'CZ', code3:'CZE'},
		{name:'Democratic Republic of the Congo', phoneCode:'243', code: 'CD', code3:'COD'},
		{name:'Denmark', phoneCode:'45', code: 'DK', code3:'DNK'},
		{name:'Djibouti', phoneCode:'253', code: 'DJ', code3:'DJI'},
		{name:'Dominica', phoneCode:'1-767', code: 'DM', code3:'DMA'},
		{name:'Dominican Republic', phoneCode:'1-809, 1-829, 1-849', code: 'DO', code3:'DOM'},
		{name:'East Timor', phoneCode:'670', code: 'TL', code3:'TLS'},
		{name:'Ecuador', phoneCode:'593', code: 'EC', code3:'ECU'},
		{name:'Egypt', phoneCode:'20', code: 'EG', code3:'EGY'},
		{name:'El Salvador', phoneCode:'503', code: 'SV', code3:'SLV'},
		{name:'Equatorial Guinea', phoneCode:'240', code: 'GQ', code3:'GNQ'},
		{name:'Eritrea', phoneCode:'291', code: 'ER', code3:'ERI'},
		{name:'Estonia', phoneCode:'372', code: 'EE', code3:'EST'},
		{name:'Ethiopia', phoneCode:'251', code: 'ET', code3:'ETH'},
		{name:'Falkland Islands', phoneCode:'500', code: 'FK', code3:'FLK'},
		{name:'Faroe Islands', phoneCode:'298', code: 'FO', code3:'FRO'},
		{name:'Fiji', phoneCode:'679', code: 'FJ', code3:'FJI'},
		{name:'Finland', phoneCode:'358', code: 'FI', code3:'FIN'},
		{name:'France', phoneCode:'33', code: 'FR', code3:'FRA'},
		{name:'French Polynesia', phoneCode:'689', code: 'PF', code3:'PYF'},
		{name:'Gabon', phoneCode:'241', code: 'GA', code3:'GAB'},
		{name:'Gambia', phoneCode:'220', code: 'GM', code3:'GMB'},
		{name:'Georgia', phoneCode:'995', code: 'GE', code3:'GEO'},
		{name:'Germany', phoneCode:'49', code: 'DE', code3:'DEU'},
		{name:'Ghana', phoneCode:'233', code: 'GH', code3:'GHA'},
		{name:'Gibraltar', phoneCode:'350', code: 'GI', code3:'GIB'},
		{name:'Greece', phoneCode:'30', code: 'GR', code3:'GRC'},
		{name:'Greenland', phoneCode:'299', code: 'GL', code3:'GRL'},
		{name:'Grenada', phoneCode:'1-473', code: 'GD', code3:'GRD'},
		{name:'Guam', phoneCode:'1-671', code: 'GU', code3:'GUM'},
		{name:'Guatemala', phoneCode:'502', code: 'GT', code3:'GTM'},
		{name:'Guernsey', phoneCode:'44-1481', code: 'GG', code3:'GGY'},
		{name:'Guinea', phoneCode:'224', code: 'GN', code3:'GIN'},
		{name:'Guinea-Bissau', phoneCode:'245', code: 'GW', code3:'GNB'},
		{name:'Guyana', phoneCode:'592', code: 'GY', code3:'GUY'},
		{name:'Haiti', phoneCode:'509', code: 'HT', code3:'HTI'},
		{name:'Honduras', phoneCode:'504', code: 'HN', code3:'HND'},
		{name:'Hong Kong', phoneCode:'852', code: 'HK', code3:'HKG'},
		{name:'Hungary', phoneCode:'36', code: 'HU', code3:'HUN'},
		{name:'Iceland', phoneCode:'354', code: 'IS', code3:'ISL'},
		{name:'India', phoneCode:'91', code: 'IN', code3:'IND'},
		{name:'Indonesia', phoneCode:'62', code: 'ID', code3:'IDN'},
		{name:'Iran', phoneCode:'98', code: 'IR', code3:'IRN'},
		{name:'Iraq', phoneCode:'964', code: 'IQ', code3:'IRQ'},
		{name:'Ireland', phoneCode:'353', code: 'IE', code3:'IRL'},
		{name:'Isle of Man', phoneCode:'44-1624', code: 'IM', code3:'IMN'},
		{name:'Israel', phoneCode:'972', code: 'IL', code3:'ISR'},
		{name:'Italy', phoneCode:'39', code: 'IT', code3:'ITA'},
		{name:'Ivory Coast', phoneCode:'225', code: 'CI', code3:'CIV'},
		{name:'Jamaica', phoneCode:'1-876', code: 'JM', code3:'JAM'},
		{name:'Japan', phoneCode:'81', code: 'JP', code3:'JPN'},
		{name:'Jersey', phoneCode:'44-1534', code: 'JE', code3:'JEY'},
		{name:'Jordan', phoneCode:'962', code: 'JO', code3:'JOR'},
		{name:'Kazakhstan', phoneCode:'7', code: 'KZ', code3:'KAZ'},
		{name:'Kenya', phoneCode:'254', code: 'KE', code3:'KEN'},
		{name:'Kiribati', phoneCode:'686', code: 'KI', code3:'KIR'},
		{name:'Kosovo', phoneCode:'383', code: 'XK', code3:'XKX'},
		{name:'Kuwait', phoneCode:'965', code: 'KW', code3:'KWT'},
		{name:'Kyrgyzstan', phoneCode:'996', code: 'KG', code3:'KGZ'},
		{name:'Laos', phoneCode:'856', code: 'LA', code3:'LAO'},
		{name:'Latvia', phoneCode:'371', code: 'LV', code3:'LVA'},
		{name:'Lebanon', phoneCode:'961', code: 'LB', code3:'LBN'},
		{name:'Lesotho', phoneCode:'266', code: 'LS', code3:'LSO'},
		{name:'Liberia', phoneCode:'231', code: 'LR', code3:'LBR'},
		{name:'Libya', phoneCode:'218', code: 'LY', code3:'LBY'},
		{name:'Liechtenstein', phoneCode:'423', code: 'LI', code3:'LIE'},
		{name:'Lithuania', phoneCode:'370', code: 'LT', code3:'LTU'},
		{name:'Luxembourg', phoneCode:'352', code: 'LU', code3:'LUX'},
		{name:'Macao', phoneCode:'853', code: 'MO', code3:'MAC'},
		{name:'Macedonia', phoneCode:'389', code: 'MK', code3:'MKD'},
		{name:'Madagascar', phoneCode:'261', code: 'MG', code3:'MDG'},
		{name:'Malawi', phoneCode:'265', code: 'MW', code3:'MWI'},
		{name:'Malaysia', phoneCode:'60', code: 'MY', code3:'MYS'},
		{name:'Maldives', phoneCode:'960', code: 'MV', code3:'MDV'},
		{name:'Mali', phoneCode:'223', code: 'ML', code3:'MLI'},
		{name:'Malta', phoneCode:'356', code: 'MT', code3:'MLT'},
		{name:'Marshall Islands', phoneCode:'692', code: 'MH', code3:'MHL'},
		{name:'Mauritania', phoneCode:'222', code: 'MR', code3:'MRT'},
		{name:'Mauritius', phoneCode:'230', code: 'MU', code3:'MUS'},
		{name:'Mayotte', phoneCode:'262', code: 'YT', code3:'MYT'},
		{name:'Mexico', phoneCode:'52', code: 'MX', code3:'MEX'},
		{name:'Micronesia', phoneCode:'691', code: 'FM', code3:'FSM'},
		{name:'Moldova', phoneCode:'373', code: 'MD', code3:'MDA'},
		{name:'Monaco', phoneCode:'377', code: 'MC', code3:'MCO'},
		{name:'Mongolia', phoneCode:'976', code: 'MN', code3:'MNG'},
		{name:'Montenegro', phoneCode:'382', code: 'ME', code3:'MNE'},
		{name:'Montserrat', phoneCode:'1-664', code: 'MS', code3:'MSR'},
		{name:'Morocco', phoneCode:'212', code: 'MA', code3:'MAR'},
		{name:'Mozambique', phoneCode:'258', code: 'MZ', code3:'MOZ'},
		{name:'Myanmar', phoneCode:'95', code: 'MM', code3:'MMR'},
		{name:'Namibia', phoneCode:'264', code: 'NA', code3:'NAM'},
		{name:'Nauru', phoneCode:'674', code: 'NR', code3:'NRU'},
		{name:'Nepal', phoneCode:'977', code: 'NP', code3:'NPL'},
		{name:'Netherlands', phoneCode:'31', code: 'NL', code3:'NLD'},
		{name:'Netherlands Antilles', phoneCode:'599', code: 'AN', code3:'ANT'},
		{name:'New Caledonia', phoneCode:'687', code: 'NC', code3:'NCL'},
		{name:'New Zealand', phoneCode:'64', code: 'NZ', code3:'NZL'},
		{name:'Nicaragua', phoneCode:'505', code: 'NI', code3:'NIC'},
		{name:'Niger', phoneCode:'227', code: 'NE', code3:'NER'},
		{name:'Nigeria', phoneCode:'234', code: 'NG', code3:'NGA'},
		{name:'Niue', phoneCode:'683', code: 'NU', code3:'NIU'},
		{name:'North Korea', phoneCode:'850', code: 'KP', code3:'PRK'},
		{name:'Northern Mariana Islands', phoneCode:'1-670', code: 'MP', code3:'MNP'},
		{name:'Norway', phoneCode:'47', code: 'NO', code3:'NOR'},
		{name:'Oman', phoneCode:'968', code: 'OM', code3:'OMN'},
		{name:'Pakistan', phoneCode:'92', code: 'PK', code3:'PAK'},
		{name:'Palau', phoneCode:'680', code: 'PW', code3:'PLW'},
		{name:'Palestine', phoneCode:'970', code: 'PS', code3:'PSE'},
		{name:'Panama', phoneCode:'507', code: 'PA', code3:'PAN'},
		{name:'Papua New Guinea', phoneCode:'675', code: 'PG', code3:'PNG'},
		{name:'Paraguay', phoneCode:'595', code: 'PY', code3:'PRY'},
		{name:'Peru', phoneCode:'51', code: 'PE', code3:'PER'},
		{name:'Philippines', phoneCode:'63', code: 'PH', code3:'PHL'},
		{name:'Pitcairn', phoneCode:'64', code: 'PN', code3:'PCN'},
		{name:'Poland', phoneCode:'48', code: 'PL', code3:'POL'},
		{name:'Portugal', phoneCode:'351', code: 'PT', code3:'PRT'},
		{name:'Puerto Rico', phoneCode:'1-787, 1-939', code: 'PR', code3:'PRI'},
		{name:'Qatar', phoneCode:'974', code: 'QA', code3:'QAT'},
		{name:'Republic of the Congo', phoneCode:'242', code: 'CG', code3:'COG'},
		{name:'Reunion', phoneCode:'262', code: 'RE', code3:'REU'},
		{name:'Romania', phoneCode:'40', code: 'RO', code3:'ROU'},
		{name:'Russia', phoneCode:'7', code: 'RU', code3:'RUS'},
		{name:'Rwanda', phoneCode:'250', code: 'RW', code3:'RWA'},
		{name:'Saint Barthelemy', phoneCode:'590', code: 'BL', code3:'BLM'},
		{name:'Saint Helena', phoneCode:'290', code: 'SH', code3:'SHN'},
		{name:'Saint Kitts and Nevis', phoneCode:'1-869', code: 'KN', code3:'KNA'},
		{name:'Saint Lucia', phoneCode:'1-758', code: 'LC', code3:'LCA'},
		{name:'Saint Martin', phoneCode:'590', code: 'MF', code3:'MAF'},
		{name:'Saint Pierre and Miquelon', phoneCode:'508', code: 'PM', code3:'SPM'},
		{name:'Saint Vincent and the Grenadines', phoneCode:'1-784', code: 'VC', code3:'VCT'},
		{name:'Samoa', phoneCode:'685', code: 'WS', code3:'WSM'},
		{name:'San Marino', phoneCode:'378', code: 'SM', code3:'SMR'},
		{name:'Sao Tome and Principe', phoneCode:'239', code: 'ST', code3:'STP'},
		{name:'Saudi Arabia', phoneCode:'966', code: 'SA', code3:'SAU'},
		{name:'Senegal', phoneCode:'221', code: 'SN', code3:'SEN'},
		{name:'Serbia', phoneCode:'381', code: 'RS', code3:'SRB'},
		{name:'Seychelles', phoneCode:'248', code: 'SC', code3:'SYC'},
		{name:'Sierra Leone', phoneCode:'232', code: 'SL', code3:'SLE'},
		{name:'Singapore', phoneCode:'65', code: 'SG', code3:'SGP'},
		{name:'Sint Maarten', phoneCode:'1-721', code: 'SX', code3:'SXM'},
		{name:'Slovakia', phoneCode:'421', code: 'SK', code3:'SVK'},
		{name:'Slovenia', phoneCode:'386', code: 'SI', code3:'SVN'},
		{name:'Solomon Islands', phoneCode:'677', code: 'SB', code3:'SLB'},
		{name:'Somalia', phoneCode:'252', code: 'SO', code3:'SOM'},
		{name:'South Africa', phoneCode:'27', code: 'ZA', code3:'ZAF'},
		{name:'South Korea', phoneCode:'82', code: 'KR', code3:'KOR'},
		{name:'South Sudan', phoneCode:'211', code: 'SS', code3:'SSD'},
		{name:'Spain', phoneCode:'34', code: 'ES', code3:'ESP'},
		{name:'Sri Lanka', phoneCode:'94', code: 'LK', code3:'LKA'},
		{name:'Sudan', phoneCode:'249', code: 'SD', code3:'SDN'},
		{name:'Suriname', phoneCode:'597', code: 'SR', code3:'SUR'},
		{name:'Svalbard and Jan Mayen', phoneCode:'47', code: 'SJ', code3:'SJM'},
		{name:'Swaziland', phoneCode:'268', code: 'SZ', code3:'SWZ'},
		{name:'Sweden', phoneCode:'46', code: 'SE', code3:'SWE'},
		{name:'Switzerland', phoneCode:'41', code: 'CH', code3:'CHE'},
		{name:'Syria', phoneCode:'963', code: 'SY', code3:'SYR'},
		{name:'Taiwan', phoneCode:'886', code: 'TW', code3:'TWN'},
		{name:'Tajikistan', phoneCode:'992', code: 'TJ', code3:'TJK'},
		{name:'Tanzania', phoneCode:'255', code: 'TZ', code3:'TZA'},
		{name:'Thailand', phoneCode:'66', code: 'TH', code3:'THA'},
		{name:'Togo', phoneCode:'228', code: 'TG', code3:'TGO'},
		{name:'Tokelau', phoneCode:'690', code: 'TK', code3:'TKL'},
		{name:'Tonga', phoneCode:'676', code: 'TO', code3:'TON'},
		{name:'Trinidad and Tobago', phoneCode:'1-868', code: 'TT', code3:'TTO'},
		{name:'Tunisia', phoneCode:'216', code: 'TN', code3:'TUN'},
		{name:'Turkey', phoneCode:'90', code: 'TR', code3:'TUR'},
		{name:'Turkmenistan', phoneCode:'993', code: 'TM', code3:'TKM'},
		{name:'Turks and Caicos Islands', phoneCode:'1-649', code: 'TC', code3:'TCA'},
		{name:'Tuvalu', phoneCode:'688', code: 'TV', code3:'TUV'},
		{name:'U.S. Virgin Islands', phoneCode:'1-340', code: 'VI', code3:'VIR'},
		{name:'Uganda', phoneCode:'256', code: 'UG', code3:'UGA'},
		{name:'Ukraine', phoneCode:'380', code: 'UA', code3:'UKR'},
		{name:'United Arab Emirates', phoneCode:'971', code: 'AE', code3:'ARE'},
		{name:'United Kingdom', phoneCode:'44', code: 'GB', code3:'GBR'},
		{name:'United States', phoneCode:'1', code: 'US', code3:'USA'},
		{name:'Uruguay', phoneCode:'598', code: 'UY', code3:'URY'},
		{name:'Uzbekistan', phoneCode:'998', code: 'UZ', code3:'UZB'},
		{name:'Vanuatu', phoneCode:'678', code: 'VU', code3:'VUT'},
		{name:'Vatican', phoneCode:'379', code: 'VA', code3:'VAT'},
		{name:'Venezuela', phoneCode:'58', code: 'VE', code3:'VEN'},
		{name:'Vietnam', phoneCode:'84', code: 'VN', code3:'VNM'},
		{name:'Wallis and Futuna', phoneCode:'681', code: 'WF', code3:'WLF'},
		{name:'Western Sahara', phoneCode:'212', code: 'EH', code3:'ESH'},
		{name:'Yemen', phoneCode:'967', code: 'YE', code3:'YEM'},
		{name:'Zambia', phoneCode:'260', code: 'ZM', code3:'ZMB'},
		{name:'Zimbabwe', phoneCode:'263', code: 'ZW', code3:'ZWE'}
	];

	var locationsService = {};

	locationsService.countries = countries;

	return locationsService;
});
