
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
 * Za podan EHR ID preberi demografske podrobnosti pacienta in izpiši sporočilo
 * s pridobljenimi podatki (ime, priimek in datum rojstva).
 */
function preberiEHRodBolnika() {
	var sessionId = getSessionId();

	var ehrId = $("#preberiEHRid").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#preberiSporocilo").html("<span class='obvestilo label label-warning " +
      "fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-success fade-in'>Bolnik '" + party.firstNames + " " +
          party.lastNames + "', ki se je rodil '" + party.dateOfBirth +
          "'.</span>");
			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-danger fade-in'>Napaka '" +
          JSON.parse(err.responseText).userMessage + "'!");
			}
		});
	}
}


/**
 * Za dodajanje vitalnih znakov pacienta je pripravljena kompozicija, ki
 * vključuje množico meritev vitalnih znakov (EHR ID, datum in ura,
 * telesna višina, telesna teža, sistolični in diastolični krvni tlak,
 * nasičenost krvi s kisikom in merilec).
 */
function dodajMeritveVitalnihZnakov() {
	var sessionId = getSessionId();

	var ehrId = $("#dodajVitalnoEHR").val();
	var datumInUra = $("#dodajVitalnoDatumInUra").val();
	var telesnaVisina = $("#dodajVitalnoTelesnaVisina").val();
	var telesnaTeza = $("#dodajVitalnoTelesnaTeza").val();
	var telesnaTemperatura = $("#dodajVitalnoTelesnaTemperatura").val();
	var sistolicniKrvniTlak = $("#dodajVitalnoKrvniTlakSistolicni").val();
	var diastolicniKrvniTlak = $("#dodajVitalnoKrvniTlakDiastolicni").val();
	var nasicenostKrviSKisikom = $("#dodajVitalnoNasicenostKrviSKisikom").val();
	var merilec = $("#dodajVitalnoMerilec").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		var podatki = {
			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
      // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
		    "ctx/language": "en",
		    "ctx/territory": "SI",
		    "ctx/time": datumInUra,
		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
		};
		var parametriZahteve = {
		    ehrId: ehrId,
		    templateId: 'Vital Signs',
		    format: 'FLAT',
		    committer: merilec
		};
		$.ajax({
		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		        $("#dodajMeritveVitalnihZnakovSporocilo").html(
              "<span class='obvestilo label label-success fade-in'>Uspešno dodano!</span>");
		    },
		    error: function(err) {
		    	$("#dodajMeritveVitalnihZnakovSporocilo").html(
            "<span class='obvestilo label label-danger fade-in'>Napaka '" + 
            JSON.parse(err.responseText).userMessage + "'!");
		    }
		});
	}
}


/**
 * Pridobivanje vseh zgodovinskih podatkov meritev izbranih vitalnih znakov
 * (telesna temperatura, filtriranje telesne temperature in telesna teža).
 * Filtriranje telesne temperature je izvedena z AQL poizvedbo, ki se uporablja
 * za napredno iskanje po zdravstvenih podatkih.
 */
function preberiMeritveVitalnihZnakov() {
	var sessionId = getSessionId();

	var ehrId = $("#meritveVitalnihZnakovEHRid").val();
	var tip = $("#preberiTipZaVitalneZnake").val();

	if (!ehrId || ehrId.trim().length == 0 || !tip || tip.trim().length == 0) {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#rezultatMeritveVitalnihZnakov").html("<br/><span>Pridobivanje " +
          "podatkov za <b>'" + tip + "'</b> bolnika <b>'" + party.firstNames +
          " " + party.lastNames + "'</b>.</span><br/><br/>");
				if (tip == "telesna temperatura") {
					$.ajax({
  					    url: baseUrl + "/view/" + ehrId + "/" + "body_temperature",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped " +
                    "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Telesna temperatura</th></tr>";
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time +
                          "</td><td class='text-right'>" + res[i].temperature +
                          " " + res[i].unit + "</td>";
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
				} else if (tip == "telesna teža") {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/" + "weight",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped " +
                    "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Telesna teža</th></tr>";
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time +
                          "</td><td class='text-right'>" + res[i].weight + " " 	+
                          res[i].unit + "</td>";
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
				} else if (tip == "telesna temperatura AQL") {
					var AQL =
						"select " +
    						"t/data[at0002]/events[at0003]/time/value as cas, " +
    						"t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude as temperatura_vrednost, " +
    						"t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/units as temperatura_enota " +
						"from EHR e[e/ehr_id/value='" + ehrId + "'] " +
						"contains OBSERVATION t[openEHR-EHR-OBSERVATION.body_temperature.v1] " +
						"where t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude<35 " +
						"order by t/data[at0002]/events[at0003]/time/value desc " +
						"limit 10";
					$.ajax({
					    url: baseUrl + "/query?" + $.param({"aql": AQL}),
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	var results = "<table class='table table-striped table-hover'>" +
                  "<tr><th>Datum in ura</th><th class='text-right'>" +
                  "Telesna temperatura</th></tr>";
					    	if (res) {
					    		var rows = res.resultSet;
						        for (var i in rows) {
						            results += "<tr><td>" + rows[i].cas +
                          "</td><td class='text-right'>" +
                          rows[i].temperatura_vrednost + " " 	+
                          rows[i].temperatura_enota + "</td>";
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}

					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
				}
	    	},
	    	error: function(err) {
	    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
            JSON.parse(err.responseText).userMessage + "'!");
	    	}
		});
	}
}


$(document).ready(function() {

  /**
   * Napolni testne vrednosti (ime, priimek in datum rojstva) pri kreiranju
   * EHR zapisa za novega bolnika, ko uporabnik izbere vrednost iz
   * padajočega menuja (npr. Pujsa Pepa).
   */
  $('#preberiPredlogoBolnika').change(function() {
    $("#kreirajSporocilo").html("");
    var podatki = $(this).val().split(",");
    $("#kreirajIme").val(podatki[0]);
    $("#kreirajPriimek").val(podatki[1]);
    $("#kreirajDatumRojstva").val(podatki[2]);
  });

  /**
   * Napolni testni EHR ID pri prebiranju EHR zapisa obstoječega bolnika,
   * ko uporabnik izbere vrednost iz padajočega menuja
   * (npr. Dejan Lavbič, Pujsa Pepa, Ata Smrk)
   */
	$('#preberiObstojeciEHR').change(function() {
		$("#preberiSporocilo").html("");
		$("#preberiEHRid").val($(this).val());
	});

  /**
   * Napolni testne vrednosti (EHR ID, datum in ura, telesna višina,
   * telesna teža, telesna temperatura, sistolični in diastolični krvni tlak,
   * nasičenost krvi s kisikom in merilec) pri vnosu meritve vitalnih znakov
   * bolnika, ko uporabnik izbere vrednosti iz padajočega menuja (npr. Ata Smrk)
   */
	$('#preberiObstojeciVitalniZnak').change(function() {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("");
		var podatki = $(this).val().split("|");
		$("#dodajVitalnoEHR").val(podatki[0]);
		$("#dodajVitalnoDatumInUra").val(podatki[1]);
		$("#dodajVitalnoTelesnaVisina").val(podatki[2]);
		$("#dodajVitalnoTelesnaTeza").val(podatki[3]);
		$("#dodajVitalnoTelesnaTemperatura").val(podatki[4]);
		$("#dodajVitalnoKrvniTlakSistolicni").val(podatki[5]);
		$("#dodajVitalnoKrvniTlakDiastolicni").val(podatki[6]);
		$("#dodajVitalnoNasicenostKrviSKisikom").val(podatki[7]);
		$("#dodajVitalnoMerilec").val(podatki[8]);
	});

  /**
   * Napolni testni EHR ID pri pregledu meritev vitalnih znakov obstoječega
   * bolnika, ko uporabnik izbere vrednost iz padajočega menuja
   * (npr. Ata Smrk, Pujsa Pepa)
   */
	$('#preberiEhrIdZaVitalneZnake').change(function() {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("");
		$("#rezultatMeritveVitalnihZnakov").html("");
		$("#meritveVitalnihZnakovEHRid").val($(this).val());
	});

});


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
            ehrID = "bcf50041-2279-473f-90ee-c616dcbc5933";
            break;
        case 2:
            ime = 'Katarina';
            priimek = 'Velika';
            datumRojstva = '1888-03-13T09:17';
            ehrID = "f8cd5997-9801-464e-9cc9-32a99b035a81";
            break;
        case 3:
            ime = 'Bedanc';
            priimek = 'Zlobni';
            datumRojstva = '1670-02-02T02:30';
            ehrID = "acf35534-1b64-44a6-9957-b7053547aaed";
            break;
    }
    
    $("#izpisEhrStalne").val(ehrID);
    
   /* $.ajaxSetup({
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
    	                    //$("#stalneSporocilo").html("<span class='obvestilo " +
                         // "label label-success fade-in'>Uspešno kreiran EHR '" +
                          //ehrId + "'.</span>");
    	                    $("#izpisEhrStalne").val(ehrId);
    	                }
    	            },
    	            error: function(err) {
    	            	$("#stalneSporocilo").html("<span class='obvestilo label " +
                    "label-danger fade-in'>Napaka '" +
                    JSON.parse(err.responseText).userMessage + "'!");
    	            }
    	        });
    	    }
    	}); */
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

function kilometriTeka(kalorije, masa) {
    // magic number: 2,8 (približek za poenostavljeno formulo)
    return kalorije/(masa*2.8);
}

function kilometriHoje(kalorije, masa) {
    // magic number: 1,87 (približek)
    return kalorije/(masa*1.87);
}

function prikaziItmInRazliko() {
    var masa = $("#preberiMasoItm").val();
    var visina = $("#preberiVisinoItm").val();
    
    if (!masa || masa.trim().length == 0) {
        $("#preberiMasoItm").val("Vpišite vašo maso!");
    }
    if (!visina || visina.trim().length == 0) {
        $("#preberiVisinoItm").val("Vpišite vašo višino!");
    } 
    
    else {
        var itm = izracunItm(masa, visina).toFixed(0);
        $("#prikaziItm").val(itm);
        if (itm <= 25) {
            $("#prikaziOdvecnoMaso").val("0 kg");
            $("#prikaziOdvecneKalorije").val("0 kcal");
        } 
        else {
            console.log("mjau");
            var odvecnaMasa = odvecnaMasa(masa, visina, itm).toFixed(2);
            $("#prikaziOdvecnoMaso").val(String(odvecnaMasa) + " kg");
            $("#prikaziOdvecneKalorije").val(String(odvecneKalorije(odvecnaMasa).toFixed(0)) + " kcal");
        }
    }
}

function prikaziTekInHojo() {
    var masa = $("#preberiMaso").val();
    var kalorije = $("#preberiKalorije").val();
    
    if (!masa || masa.trim().length == 0) {
        $("#preberiMaso").val("Vpišite vašo maso!");
    }
    
    if (!kalorije || kalorije.trim().length == 0) {
        $("#preberiKalorije").val("Vpišite kalorije, ki jih želite izgubiti!");
    }
    
    else {
        $("#prikaziHojo").val(kilometriHoje(kalorije, masa).toFixed(3) + " km");
        $("#prikaziTek").val(kilometriTeka(kalorije, masa).toFixed(3) + " km");
    }

}
// TODO: Tukaj implementirate funkcionalnost, ki jo podpira vaša aplikacija
