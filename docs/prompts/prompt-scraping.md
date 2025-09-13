Je veux que tu créer un script python qui perme d'automatiser le talécharger de donénes de localisation d'espcèes végétales :

Les espcèes qui font l'objet de l'étude sont dans ce docimenet (cellules A1:A151) :
"C:\Users\utilisateur\Mon Drive\1 - Bota & Travail\+++++++++  BOTA  +++++++++\---------------------- 3) BDD\PYTHON\0) Scripts Python\Koalactivit-\Taxons Koala.xlsx"


Paour chaque espcèes du tableau (chaque ligne du fichier), le workflow est le suivant :

1) on ouvre cet URL :
https://donnees.biodiversite-auvergne-rhone-alpes.fr/#/synthese

2) on clique la :
<input autocapitalize="off" autocorrect="off" role="combobox" aria-multiline="false" data-qa="taxonomy-form-input" type="text" id="taxonInput" class="form-control form-control-sm ng-valid ng-dirty open ng-touched" autocomplete="off" aria-autocomplete="list" aria-expanded="true" aria-activedescendant="ngb-typeahead-0-0" aria-owns="ngb-typeahead-0">

3) la on colle la cellule A1 du fichier excel '"C:\Users\utilisateur\Mon Drive\1 - Bota & Travail\+++++++++  BOTA  +++++++++\---------------------- 3) BDD\PYTHON\0) Scripts Python\Koalactivit-\Taxons Koala.xlsx"
)


4) on attend 2 sec

5) On appuie sur entrée (clavier) pour valider

5) on clique la :
<input aria-autocomplete="list" type="text" autocorrect="off" autocapitalize="off" autocomplete="a01311f1b606" aria-activedescendant="a01311f1b606-0" aria-controls="a01311f1b606">



6) On colle e texte 'Isere'


7) on clique la pour lancer la recherche:
<span class="mat-button-wrapper"> Rechercher </span>


8) on attend 30 secondes pour que les donéne se chargent

9) on télécharger les données avec ca:
<button _ngcontent-ltx-c436="" type="button" id="download-btn" mat-raised-button="" color="primary" class="mat-focus-indicator uppercase mat-raised-button mat-button-base mat-primary"><span class="mat-button-wrapper"> Télécharger <mat-icon _ngcontent-ltx-c436="" role="img" class="mat-icon notranslate material-icons mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font">file_download</mat-icon></span><span matripple="" class="mat-ripple mat-button-ripple"></span><span class="mat-button-focus-overlay"></span></button>

10) on valide en cliquant la dessus :
<span class="mat-button-wrapper"> Format shapefile </span>



Ensuite on refait le même processus mais a la place de cliquer sur la cellule A1 dans l'étape 4 on lcique sur l'étpae A2 et on continue le priocessus jusqu'à qu'on arrive a A151
