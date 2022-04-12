import forge from "node-forge";
import fs from "fs";
import path from "path";
import config from "../common/config";
import _ from "lodash";
import mkdirp from "mkdirp";

const utils = {};
const pki = forge.pki;

utils.createCA = function(CN) {
  const keys = pki.rsa.generateKeyPair(2048);
  const cert = pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = String(new Date().getTime());
  cert.validity.notBefore = new Date(new Date().getTime() - 60 * 60 * 1000);
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 20);
  const attrs = [
    {
      name: "commonName",
      value: CN
    },
    {
      name: "countryName",
      value: "CN"
    },
    {
      shortName: "ST",
      value: "BeiJing"
    },
    {
      name: "localityName",
      value: "BeiJing"
    },
    {
      name: "organizationName",
      value: "fast-dev"
    },
    {
      shortName: "OU",
      value: "https://github.com/ineo6/fast-dev"
    }
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([
    {
      name: "basicConstraints",
      critical: true,
      cA: true
    },
    {
      name: "keyUsage",
      critical: true,
      keyCertSign: true
    },
    {
      name: "subjectKeyIdentifier"
    }
  ]);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  return {
    key: keys.privateKey,
    cert: cert
  };
};

utils.covertNodeCertToForgeCert = function(originCertificate) {
  const obj = forge.asn1.fromDer(originCertificate.raw.toString("binary"));
  return forge.pki.certificateFromAsn1(obj);
};

utils.createFakeCertificateByDomain = function(caKey, caCert, domain) {
  const keys = pki.rsa.generateKeyPair(2048);
  const cert = pki.createCertificate();
  cert.publicKey = keys.publicKey;

  cert.serialNumber = String(new Date().getTime());
  cert.validity.notBefore = new Date();
  cert.validity.notBefore.setFullYear(
    cert.validity.notBefore.getFullYear() - 1
  );
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);
  const attrs = [
    {
      name: "commonName",
      value: domain
    },
    {
      name: "countryName",
      value: "CN"
    },
    {
      shortName: "ST",
      value: "GuangDong"
    },
    {
      name: "localityName",
      value: "XiaMen"
    },
    {
      name: "organizationName",
      value: "fast-dev"
    },
    {
      shortName: "OU",
      value: "https://github.com/ineo6/fast-dev"
    }
  ];

  cert.setIssuer(caCert.subject.attributes);
  cert.setSubject(attrs);

  cert.setExtensions([
    {
      name: "basicConstraints",
      critical: true,
      cA: false
    },
    {
      name: "subjectAltName",
      altNames: [
        {
          type: 2,
          value: domain
        }
      ]
    },
    {
      name: "subjectKeyIdentifier"
    },
    {
      name: "extKeyUsage",
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true
    },
    {
      name: "authorityKeyIdentifier"
    }
  ]);
  cert.sign(caKey, forge.md.sha256.create());

  return {
    key: keys.privateKey,
    cert: cert
  };
};

utils.createFakeCertificateByCA = function(caKey, caCert, originCertificate) {
  const certificate = utils.covertNodeCertToForgeCert(originCertificate);

  const keys = pki.rsa.generateKeyPair(2048);
  const cert = pki.createCertificate();
  cert.publicKey = keys.publicKey;

  cert.serialNumber = certificate.serialNumber;
  cert.validity.notBefore = new Date();
  cert.validity.notBefore.setFullYear(
    cert.validity.notBefore.getFullYear() - 1
  );
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);

  cert.setSubject(certificate.subject.attributes);
  cert.setIssuer(caCert.subject.attributes);

  certificate.subjectaltname &&
    (cert.subjectaltname = certificate.subjectaltname);

  const subjectAltName = _.find(certificate.extensions, {
    name: "subjectAltName"
  });
  cert.setExtensions([
    {
      name: "basicConstraints",
      critical: true,
      cA: false
    },
    {
      name: "keyUsage",
      critical: true,
      digitalSignature: true,
      contentCommitment: true,
      keyEncipherment: true,
      dataEncipherment: true,
      keyAgreement: true,
      keyCertSign: true,
      cRLSign: true,
      encipherOnly: true,
      decipherOnly: true
    },
    {
      name: "subjectAltName",
      altNames: subjectAltName.altNames
    },
    {
      name: "subjectKeyIdentifier"
    },
    {
      name: "extKeyUsage",
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true
    },
    {
      name: "authorityKeyIdentifier"
    }
  ]);
  cert.sign(caKey, forge.md.sha256.create());

  return {
    key: keys.privateKey,
    cert: cert
  };
};

utils.isBrowserRequest = function(userAgent) {
  return /Mozilla/i.test(userAgent);
};

utils.isMappingHostName = function(DNSName, hostname) {
  let reg = DNSName.replace(/\./g, "\\.").replace(/\*/g, "[^.]+");
  reg = "^" + reg + "$";
  return new RegExp(reg).test(hostname);
};

utils.getMappingHostNamesFormCert = function(cert) {
  let mappingHostNames = [];
  mappingHostNames.push(
    cert.subject.getField("CN") ? cert.subject.getField("CN").value : ""
  );
  const altNames = cert.getExtension("subjectAltName")
    ? cert.getExtension("subjectAltName").altNames
    : [];
  mappingHostNames = mappingHostNames.concat(_.map(altNames, "value"));
  return mappingHostNames;
};

// sync
utils.initCA = function({ caCertPath, caKeyPath }) {
  try {
    fs.accessSync(caCertPath, fs.F_OK);
    fs.accessSync(caKeyPath, fs.F_OK);

    // has exist
    return {
      caCertPath,
      caKeyPath,
      create: false
    };
  } catch (e) {
    const caObj = utils.createCA(config.caName);

    const caCert = caObj.cert;
    const cakey = caObj.key;

    const certPem = pki.certificateToPem(caCert);
    const keyPem = pki.privateKeyToPem(cakey);

    mkdirp.sync(path.dirname(caCertPath));
    fs.writeFileSync(caCertPath, certPem);
    fs.writeFileSync(caKeyPath, keyPem);
  }
  return {
    caCertPath,
    caKeyPath,
    create: true
  };
};

export default utils;
