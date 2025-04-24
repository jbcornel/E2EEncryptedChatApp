import * as openpgp from 'openpgp';

//Encrypt with recipient's public key 
export async function encryptWithPublicKey(plaintext, recipientPublicKeyArmored) {
  if (!recipientPublicKeyArmored || recipientPublicKeyArmored.length < 32) {
    throw new Error("Invalid public key provided.");
  }
  const publicKey = await openpgp.readKey({ armoredKey: recipientPublicKeyArmored.trim() });

  const encrypted = await openpgp.encrypt({
    message: await openpgp.createMessage({ text: plaintext }),
    encryptionKeys: publicKey,
  });

  return encrypted; 
}

//Decrypt with your own private key
export async function decryptWithPrivateKey(ciphertext, myPrivateKeyArmored, passphrase) {
  
  if (!myPrivateKeyArmored || !passphrase) {
    throw new Error('Missing private key or passphrase');
  }

  console.log("decryptWithPrivateKey: privKey start:", myPrivateKeyArmored.slice(0, 30), "end:", myPrivateKeyArmored.slice(-30));
  console.log("decryptWithPrivateKey: passphrase:", passphrase);

 
  const privateKey = await openpgp.readPrivateKey({ armoredKey: myPrivateKeyArmored.trim() });

  
  const decryptedPrivateKey = await openpgp.decryptKey({
    privateKey,
    passphrase: passphrase.trim(),
  });

  
  const message = await openpgp.readMessage({ armoredMessage: ciphertext.trim() });

  
  const { data: decrypted } = await openpgp.decrypt({
    message,
    decryptionKeys: decryptedPrivateKey,
  });

  return decrypted;
}
