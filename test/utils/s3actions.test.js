import {expect} from "chai";
import sinon from "sinon";
import {getSignedUrl} from "../../utils/s3Actions.js";
import {S3RequestPresigner} from "@aws-sdk/s3-request-presigner";
import {HttpRequest} from "@aws-sdk/protocol-http";

describe("getSignedUrl function", () => {
    it("should return a signed URL", (done) => {
        const key = "testkey",
            presignedUrl = "https://example.com/presignedUrl",
            presignerStub = sinon.stub(S3RequestPresigner.prototype, "presign");

        presignerStub.returns(Promise.resolve(presignedUrl));

        getSignedUrl(key).then((result) => {

            expect(presignerStub.calledOnceWith(sinon.match.instanceOf(HttpRequest))).to.be.true;
            expect(result).to.equal(presignedUrl);

            presignerStub.restore();
            done();
        });
    });
});
