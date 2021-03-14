<?php


  $nome = $_POST['nome'];
  $telefone = $_POST['telefone'];
  $email = $_POST['email'];
  $npessoas = $_POST['npessoas'];
  $cozinha = $_POST['cozinha'];
  $data = $_POST['data'];
  $hora = $_POST['hora'];

  $email_from = $_POST['email'];

  $email_subject = "Formulário do Site";

  $email_body = "Nome: $nome.\n".
                "Telefone: $telefone.\n".
                "Email: $email.\n".
                "Número de pessoas: $npessoas.\n".
                "Cozinha: $cozinha.\n".
                "Data: $data.\n".
                "Hora: $hora.\n";

  $to = "contato@espacointimista.com.br";

  $headers = "From: $email_from \r\n";

  $headers .= "Reply-To: $visitor_email \r\n";

  mail($to,$email_subject,$email_body,$headers);
  header("Location: index.html")

?>
