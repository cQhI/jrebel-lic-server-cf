import {handleHTML} from './home.js'
addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    switch (path) {
        case "/jrebel/validate-connection":
            return handleJrebelValidate(request);
        case "/jrebel/leases/1":
        case "/agent/leases/1":
            return handleJrebelLeases1(request);
        case "/jrebel/leases":
        case "/agent/leases":
            return handleJrebelLeases(request);
        case "/rpc/releaseTicket.action":
            return handleReleaseTicket(request);
        case "/rpc/obtainTicket.action":
            return handleObtainTicket(request);
        case "/rpc/ping.action":
            return handlePing(request);
        default:
            return handleHTML(request);
    }
}

async function handleJrebelValidate(request) {
    const jsonResponse = {
        serverVersion: "3.2.4",
        serverProtocolVersion: "1.1",
        serverGuid: "a1b4aea8-b031-4302-b602-670a990272cb",
        groupType: "managed",
        statusCode: "SUCCESS",
        company: "Administrator",
        canGetLease: true,
        licenseType: 1,
        evaluationLicense: false,
        seatPoolType: "standalone",
    };
    return new Response(JSON.stringify(jsonResponse), {
        headers: { "Content-Type": "application/json" },
    });
}

async function handleJrebelLeases1(request) {
    if (request.method !== "DELETE") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    const formData = await request.formData();
    const username = formData.get("username");

    const jsonResponse = {
        serverVersion: "3.2.4",
        serverProtocolVersion: "1.1",
        serverGuid: "a1b4aea8-b031-4302-b602-670a990272cb",
        groupType: "managed",
        statusCode: "SUCCESS",
        msg: null,
        statusMessage: null,
    };

    if (username) {
        jsonResponse.company = username;
    }

    return new Response(JSON.stringify(jsonResponse), {
        headers: { "Content-Type": "application/json" },
    });
}

async function handleJrebelLeases(request) {
    const formData = await request.formData();
    const clientRandomness = formData.get("randomness");
    const username = formData.get("username");
    const guid = formData.get("guid");
    const offline = formData.get("offline") === "true";

    if (!clientRandomness || !username || !guid) {
        return new Response("Forbidden", { status: 403 });
    }

    let validFrom = "null";
    let validUntil = "null";

    if (offline) {
        const clientTime = formData.get("clientTime");
        const offlineDays = formData.get("offlineDays");
        const clinetTimeUntil =
            parseInt(clientTime) + 180 * 24 * 60 * 60 * 1000;
        validFrom = clientTime;
        validUntil = clinetTimeUntil.toString();
    }

    // Here we need to implement the JrebelSign functionality
    const signature = await generateSignature(
        clientRandomness,
        guid,
        offline,
        validFrom,
        validUntil
    );

    const jsonResponse = {
        serverVersion: "3.2.4",
        serverProtocolVersion: "1.1",
        serverGuid: "a1b4aea8-b031-4302-b602-670a990272cb",
        groupType: "managed",
        id: 1,
        licenseType: 1,
        evaluationLicense: false,
        signature: signature,
        serverRandomness: "H2ulzLlh7E0=",
        seatPoolType: "standalone",
        statusCode: "SUCCESS",
        offline: offline,
        validFrom: validFrom,
        validUntil: validUntil,
        company: username,
        orderId: "",
        zeroIds: [],
        licenseValidFrom: 1490544001000,
        licenseValidUntil: 1691839999000,
    };

    return new Response(JSON.stringify(jsonResponse), {
        headers: { "Content-Type": "application/json" },
    });
}

async function handleReleaseTicket(request) {
    const formData = await request.formData();
    const salt = formData.get("salt");

    if (!salt) {
        return new Response("Forbidden", { status: 403 });
    }

    const xmlContent = `<ReleaseTicketResponse><message></message><responseCode>OK</responseCode><salt>${salt}</salt></ReleaseTicketResponse>`;
    const xmlSignature = await signXml(xmlContent);
    const body = `<!-- ${xmlSignature} -->\n${xmlContent}`;

    return new Response(body, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}

async function handleObtainTicket(request) {
    const formData = await request.formData();
    const salt = formData.get("salt");
    const username = formData.get("userName");
    const prolongationPeriod = "607875500";

    if (!salt || !username) {
        return new Response("Forbidden", { status: 403 });
    }

    const xmlContent = `<ObtainTicketResponse><message></message><prolongationPeriod>${prolongationPeriod}</prolongationPeriod><responseCode>OK</responseCode><salt>${salt}</salt><ticketId>1</ticketId><ticketProperties>licensee=${username}\tlicenseType=0\t</ticketProperties></ObtainTicketResponse>`;
    const xmlSignature = await signXml(xmlContent);
    const body = `<!-- ${xmlSignature} -->\n${xmlContent}`;

    return new Response(body, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}

async function handlePing(request) {
    const formData = await request.formData();
    const salt = formData.get("salt");

    if (!salt) {
        return new Response("Forbidden", { status: 403 });
    }

    const xmlContent = `<PingResponse><message></message><responseCode>OK</responseCode><salt>${salt}</salt></PingResponse>`;
    const xmlSignature = await signXml(xmlContent);
    const body = `<!-- ${xmlSignature} -->\n${xmlContent}`;

    return new Response(body, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}

async function generateSignature(
    clientRandomness,
    guid,
    offline,
    validFrom,
    validUntil
) {
    let js = new JrebelSign();
    let result = js.toLeaseCreateJson(
        clientRandomness,
        guid,
        offline,
        validFrom,
        validUntil
    );
    return result;
}

async function signXml(xmlContent) {
    let result = RsaSign.sign(xmlContent);
    return result;
}

class JrebelSign {
    constructor() {
        this.signature = "";
    }

    async toLeaseCreateJson(
        clientRandomness,
        guid,
        offline,
        validFrom,
        validUntil
    ) {
        const serverRandomness = "H2ulzLlh7E0=";
        let s2 = "";
        if (offline) {
            s2 = [
                clientRandomness,
                serverRandomness,
                guid,
                String(offline),
                validFrom,
                validUntil,
            ].join(";");
        } else {
            s2 = [
                clientRandomness,
                serverRandomness,
                guid,
                String(offline),
            ].join(";");
        }
        console.log(s2);
        const signedBytes = await LicenseServer2ToJRebelPrivateKey.sign(
            new TextEncoder().encode(s2)
        );
        this.signature = await ByteUtil.sign(signedBytes);
        return this.signature;
    }

    getSignature() {
        return this.signature;
    }
}

class ByteUtil {
    static async sign(binaryData) {
        if (!binaryData) return null;
        return btoa(
            String.fromCharCode.apply(null, new Uint8Array(binaryData))
        );
    }

    static async signString(s) {
        if (!s) return null;
        return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    }

    static async signNumber(n) {
        const array = new Uint8Array(n);
        crypto.getRandomValues(array);
        return array;
    }

    static async bytesToHexString(src) {
        if (!src || src.length === 0) return null;
        return Array.from(new Uint8Array(src), (x) =>
            x.toString(16).padStart(2, "0")
        ).join("");
    }
}

class RsaSign {
    static key22 =
        "MIIBOgIBAAJBALecq3BwAI4YJZwhJ+snnDFj3lF3DMqNPorV6y5ZKXCiCMqj8OeOmxk4YZW9aaV9" +
        "ckl/zlAOI0mpB3pDT+Xlj2sCAwEAAQJAW6/aVD05qbsZHMvZuS2Aa5FpNNj0BDlf38hOtkhDzz/h" +
        "kYb+EBYLLvldhgsD0OvRNy8yhz7EjaUqLCB0juIN4QIhAOeCQp+NXxfBmfdG/S+XbRUAdv8iHBl+" +
        "F6O2wr5fA2jzAiEAywlDfGIl6acnakPrmJE0IL8qvuO3FtsHBrpkUuOnXakCIQCqdr+XvADI/UTh" +
        "TuQepuErFayJMBSAsNe3NFsw0cUxAQIgGA5n7ZPfdBi3BdM4VeJWb87WrLlkVxPqeDSbcGrCyMkC" +
        "IFSs5JyXvFTreWt7IQjDssrKDRIPmALdNjvfETwlNJyY";

    static async sign(content) {
        return RsaSign.signWithKey(content, RsaSign.key22);
    }

    static async signWithKey(content, privateKeyBase64) {
        const privateKey = await crypto.subtle.importKey(
            "pkcs8",
            await ByteUtil.signString(privateKeyBase64),
            {
                name: "RSASSA-PKCS1-v1_5",
                hash: "MD5",
            },
            false,
            ["sign"]
        );

        const signature = await crypto.subtle.sign(
            "RSASSA-PKCS1-v1_5",
            privateKey,
            new TextEncoder().encode(content)
        );

        return ByteUtil.bytesToHexString(signature);
    }
}

class LicenseServer2ToJRebelPrivateKey {
    static c =
        "MIICXAIBAAKBgQDQ93CP6SjEneDizCF1P/MaBGf582voNNFcu8oMhgdTZ/N6qa6O7XJDr1FSCyaDdKSsPCdxPK7Y4Usq/fOPas2kCgYcRS/iebrtPEFZ/7TLfk39HLuTEjzo0/CNvjVsgWeh9BYznFaxFDLx7fLKqCQ6w1OKScnsdqwjpaXwXqiulwIDAQABAoGATOQvvBSMVsTNQkbgrNcqKdGjPNrwQtJkk13aO/95ZJxkgCc9vwPqPrOdFbZappZeHa5IyScOI2nLEfe+DnC7V80K2dBtaIQjOeZQt5HoTRG4EHQaWoDh27BWuJoip5WMrOd+1qfkOtZoRjNcHl86LIAh/+3vxYyebkug4UHNGPkCQQD+N4ZUkhKNQW7mpxX6eecitmOdN7Yt0YH9UmxPiW1LyCEbLwduMR2tfyGfrbZALiGzlKJize38shGC1qYSMvZFAkEA0m6psWWiTUWtaOKMxkTkcUdigalZ9xFSEl6jXFB94AD+dlPS3J5gNzTEmbPLc14VIWJFkO+UOrpl77w5uF2dKwJAaMpslhnsicvKMkv31FtBut5iK6GWeEafhdPfD94/bnidpP362yJl8Gmya4cI1GXvwH3pfj8S9hJVA5EFvgTB3QJBAJP1O1uAGp46X7Nfl5vQ1M7RYnHIoXkWtJ417Kb78YWPLVwFlD2LHhuy/okT4fk8LZ9LeZ5u1cp1RTdLIUqAiAECQC46OwOm87L35yaVfpUIjqg/1gsNwNsj8HvtXdF/9d30JIM3GwdytCvNRLqP35Ciogb9AO8ke8L6zY83nxPbClM=";

    static async importKey() {
        return crypto.subtle.importKey(
            "pkcs8",
            await ByteUtil.signString(LicenseServer2ToJRebelPrivateKey.c),
            {
                name: "RSASSA-PKCS1-v1_5",
                hash: "SHA-1",
            },
            false,
            ["sign"]
        );
    }

    static async sign(array) {
        const key = await LicenseServer2ToJRebelPrivateKey.importKey();
        return crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, array);
    }
}
