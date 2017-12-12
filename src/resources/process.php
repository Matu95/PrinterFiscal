<?php

header('Access-Control-Allow-Origin: *');
$_POST = json_decode(file_get_contents('php://input'), true);


class pyPrinter
{

  function __construct($env)
  {
    $this->Connect($env);
  }
  public function lastnum(){
      $lastnumber = $this->ctrl->ConsultarUltNro($_POST['typeinvoice']);
      echo $lastnumber;
  }

  private function Connect($env)
  {
    error_reporting(-1);
    try {
      if (@class_exists('COM')) {
        $this->ctrl = new COM('PyFiscalPrinter') or die("No se puede crear el objeto");
        # habilitar excecpciones (capturarlas con un bloque try/except), ver abajo:
        $this->ctrl->LanzarExcepciones = true;
      } else if (@class_exists('Dbus')) {
          $dbus = new Dbus( Dbus::BUS_SESSION, true );
          $this->ctrl = $dbus->createProxy("ar.com.pyfiscalprinter.Service",
                                          "/ar/com/pyfiscalprinter/Object",
                                          "ar.com.pyfiscalprinter.Interface");
      } else {
        echo "No existe soporte para COM (Windows) o DBus (Linux) \n";
        exit(1);
      }

      $ok = $this->ctrl->Conectar($env['marca'], $env['modelo'],
        $env['puerto'], $env['equipo']);

      if ($ok) {
        //echo "<h4>Impresora '".$env['marca'].' '.$env['modelo']."' conectada!</h4>";
      } else {
        # Analizar errores (si no se habilito lanzar excepciones)
        echo "Excepcion: {$ctrl->Excepcion}\n";
        echo "Traza: {$ctrl->Traceback}\n";
        exit(1);
      }
    } catch(Exception $e) {
      echo $e->getMessage();
    }
  }
  public function printInvoice()
  {
      $dataclient=$_POST['dataclient'];
      $items=$_POST['items'];

      $tipo_cbte = $dataclient['typeinvoice'];
      $tipo_doc = 80;                   // CUIT
      $nro_doc = $dataclient['cuit'];;
      $nombre_cliente = $dataclient['razonsocial'];
      $domicilio_cliente = $dataclient['domicilio'];
      $tipo_responsable = $dataclient['iva_cliente'];
      $referencia = "";

      $this->ctrl->AbrirComprobante(
        $tipo_cbte,
        $tipo_responsable,
        $tipo_doc,
        $nro_doc,
        $nombre_cliente,
        $domicilio_cliente,
        $referencia
      );

      foreach ($items as $item) {
        # Imprimo un art�culo:
        $ds = $item['description'];
        $qty = $item['quantity'];
        $price = $item['price'];
        $bonif = 0.00;
        $alic_iva = $dataclient['iva'];
        $this->ctrl->ImprimirItem($ds, $qty, $price, $alic_iva);
      }
      $type_payment = $dataclient['type_payment'];
      $payment = $dataclient['entrega'];
      # Imprimir un pago (si es superior al total, se imprime el vuelto):
      $this->ctrl->ImprimirPago($type_payment, $payment);

      $this->ctrl->CerrarComprobante();

  }

  public function closingZ() {
    try {
      if ($this->ctrl->CierreDiario('Z')) {
      }
    } catch (Exception $e) {
      echo $e->getMessage();
    }
  }

  public function closingX() {
    try {
      if($this->ctrl->CierreDiario('X')) {
      }
    } catch (Exception $e) {
      echo $e->getMessage();
    }
  }
}

$env = parse_ini_file("env.ini");
$invoice = new pyPrinter($env);

if (isset($_GET['cierrez'])) {
  $invoice->closingZ();
} else if (isset($_GET['cierrex'])) {
  $invoice->closingX();
} elseif ($_POST['lastnumber'] = 'lastnumber') {
  $invoice->lastnum();
}  elseif ($_POST['operation'] = 'printinvoice') {
  $invoice->printInvoice();
}
?>
