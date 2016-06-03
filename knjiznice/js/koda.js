
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

/*global $*/
/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Kreiraj nov EHR zapis za pacienta in dodaj osnovne demografske podatke.
 * V primeru uspešne akcije izpiši sporočilo s pridobljenim EHR ID, sicer
 * izpiši napako.
 */
function kreirajEHRzaBolnika() {
    var sessionId = getSessionId();

	var ime = $("#kreirajIme").val();
	var priimek = $("#kreirajPriimek").val();
	var datumRojstva = $("#kreirajDatumRojstva").val();

	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 ||
      priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label " +
      "label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    $("#kreirajSporocilo").html("<span class='obvestilo " +
                          "label label-success fade-in'>Uspešno kreiran EHR '" +
                          ehrId + "'.</span>");
		                    $("#preberiEHRid").val(ehrId);
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label " +
                    "label-danger fade-in'>Napaka '" +
                    JSON.parse(err.responseText).userMessage + "'!");
		            }
		        });
		    }
		});
	}
}


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generirajPodatke(stPacienta) {
    var sessionId = getSessionId();
    
    var ehrID;
    
    var ime;
    var priimek;
    var datumRojstva;
    
    switch (stPacienta) {
        case 1:
            ime = 'Peter';
            priimek = 'Klepec';
            datumRojstva = '1991-04-20T04:20';
            break;
        case 2:
            ime = 'Katarina';
            priimek = 'Velika';
            datumRojstva = '1888-03-13T09:17';
            break;
        case 3:
            ime = 'Bedanc';
            priimek = 'Zlobni';
            datumRojstva = '1670-02-02T02:30';
            break;
    }
    
    $.ajaxSetup({
    	    headers: {"Ehr-Session": sessionId}
    	});
    	$.ajax({
    	    url: baseUrl + "/ehr",
    	    type: 'POST',
    	    success: function (data) {
    	        var ehrId = data.ehrId;
    	        var partyData = {
    	            firstNames: ime,
    	            lastNames: priimek,
    	            dateOfBirth: datumRojstva,
    	            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
    	        };
    	        $.ajax({
    	            url: baseUrl + "/demographics/party",
    	            type: 'POST',
    	            contentType: 'application/json',
    	            data: JSON.stringify(partyData),
    	            success: function (party) {
    	                if (party.action == 'CREATE') {
    	                    ehrID = ehrId;
    	                    $("#kreirajSporocilo").html("<span class='obvestilo " +
                          "label label-success fade-in'>Uspešno kreiran EHR '" +
                          ehrId + "'.</span>");
    	                    $("#izpisEhrStalne").val(ehrId);
    	                }
    	            },
    	            error: function(err) {
    	            	$("#kreirajSporocilo").html("<span class='obvestilo label " +
                    "label-danger fade-in'>Napaka '" +
                    JSON.parse(err.responseText).userMessage + "'!");
    	            }
    	        });
    	    }
    	});
    
    return ehrID;
}

function izracunItm(masa, visina) {
    return masa/(visina*visina/10000);
}

function odvecnaMasa(masa, visina, itm) {
    if (itm>=25) return 0;
    else {
        return (itm - 25) * (visina*visina/10000);
    }
}

function odvecneKalorije(masa) {
    return masa*9000;
}

function kilometriTeka(kalorije, ...) {
    // body...
}
// TODO: Tukaj implementirate funkcionalnost, ki jo podpira vaša aplikacija
