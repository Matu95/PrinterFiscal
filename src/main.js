import Vue from 'vue'
import axios from 'axios';

//VueNotifications
import VueNotifications from 'vue-notifications'
import iziToast from 'izitoast'// https://github.com/dolce/iziToast
import 'izitoast/dist/css/iziToast.min.css'

function toast ({title, message, type, timeout, cb}) {
  if (type === VueNotifications.types.warn) type = 'warning'
  return iziToast[type]({title, message, timeout})
}
const options = {
  success: toast,
  error: toast,
  info: toast,
  warn: toast
}

Vue.use(VueNotifications, options)

new Vue({
  el: '#app',
  mounted(){
    this.connect();
  },
  data: {
    Config: {
       marca: 'Epson',
       modelo: 'epsonlx300+',
       puerto: 'COM2'
    },
    nroinvoice: 'N/A',
    status: 'Disconect',
    newproduct: null,
    newdescription: null,
    newquantity: null,
    newprice: null,
    dataclient: {
      razonsocial: null,
      cuit: null,
      domicilio: null,
      iva_cliente: 1,
      typeinvoice: 1,
      type_payment: 'Efectivo',
      entrega: null,
      iva: 1.21
    },
    items: [],
    subTotal: 0,
    total: 0,
    ivamonto: 0
  },
  methods: {
    connect(){
       axios.post('http://localhost/PrinterFiscal/src/resources/process.php',
       {
         typeinvoice: this.dataclient.typeinvoice,
         operation: 'printinvoice'
       },
       {
         headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
       }
       ).then(response => {
         if (response.data == parseInt(response.data,10)) {
           this.nroinvoice = response.data
           this.status = 'Connect'
           this.showSuccessMsg({message: "Impresora conectada."});
         }else {
           this.showErrorMsg({message: "Impresora desconectada."});
           this.nroinvoice = 'N/A'
           this.status = 'Disconect'
         }
       }).catch (e => {
         this.showErrorMsg({message: "Impresora desconectada."});
         this.nroinvoice = 'N/A'
         this.status = 'Disconect'
       })
    },
    lastnumber(){
       axios.post('http://localhost/PrinterFiscal/src/resources/process.php',
       {
         typeinvoice: this.dataclient.typeinvoice,
         operation: 'printinvoice'
       },
       {
         headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
       }
       ).then(response => {
         if (response.data == parseInt(response.data,10)) {
           this.nroinvoice = response.data
           this.status = 'Connect'
           this.showInfoMsg({message: "Cambiando tipo de factura."});
         }else {
           this.showErrorMsg({message: "Impresora desconectada."});
           this.nroinvoice = 'N/A'
           this.status = 'Disconect'
         }
       }).catch (e => {
         this.showErrorMsg({message: "Impresora desconectada."});
         this.nroinvoice = 'N/A'
         this.status = 'Disconect'
       })
    },
    additem(){
      this.items.push({
        product:this.newproduct,
        description:this.newdescription,
        quantity:this.newquantity,
        price:this.newprice,
      });
      this.calculate();
      this.showSuccessMsg({message: "Se agrego un articulo."});
      this.newproduct = null;
      this.newdescription = null;
      this.newquantity = null;
      this.newprice = null;

    },
    DeleteItem(index){
      this.items.splice(index, 1);
      this.calculate();
      this.showSuccessMsg({message: "Se elimino correctamente."});
    },
    calculate(){
      var total=0;
      var montoIva=0;
      var subtotal=0
      this.items.forEach(function(item) {
          if (item.quantity && item.price){
              total = parseFloat(total)+(parseInt(item.quantity)*parseFloat(item.price));
          }
      });

      montoIva = total-total/this.dataclient.iva;
      subtotal = total-montoIva;
      this.subTotal = parseFloat(subtotal).toFixed(2);
      this.ivamonto = parseFloat(montoIva).toFixed(2);
      this.total = parseFloat(total).toFixed(2);
    },
    printinvoice(){
      if (this.status=='Connect') {
        axios.post('http://localhost/PrinterFiscal/src/resources/process.php',{
          dataclient: this.dataclient,
          items: this.items,
          operation: 'printinvoice'
        },
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
        ).then(response => {
          this.showSuccessMsg({message: "Impreso correctamente."});
        }).catch (e => {
          this.showErrorMsg({message: "Algo salió mal."});
        })
      }else {
        this.showErrorMsg({message: "Impresora Desconectada."});
      }
    },
    cierreZ(){
       axios.get('http://localhost/PrinterFiscal/src/resources/process.php?cierrez',
       {
         headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
       }
       ).then(response => {
         this.showSuccessMsg({message: "Se genero el cierre Z."});
       }).catch (e => {
         this.showErrorMsg({message: "Algo salió mal."});
       })
    }
  },
  notifications: {
   showSuccessMsg: {
     type: VueNotifications.types.success,
     title: 'Exito'
   },
   showInfoMsg: {
     type: VueNotifications.types.info,
     title: 'Info'
   },
   showWarnMsg: {
     type: VueNotifications.types.warn,
     title: 'Atención'
   },
   showErrorMsg: {
     type: VueNotifications.types.error,
     title: 'Error'
   }
 }
})
