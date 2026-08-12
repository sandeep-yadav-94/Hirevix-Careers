import axios from "axios";
import getBuffer from "../utils/buffers.js";
import { sql } from "../utils/db.js";
import ErrorHandler from "../utils/errorHandler.js";
import { TryCatch } from "../utils/TryCatch.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { createHash, randomInt } from 'crypto'
import { Resend } from 'resend'

const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_MS = 60_000;
const MAX_OTP_ATTEMPTS = 5;

const hashOtp = (otp: string) => createHash('sha256').update(otp).digest('hex');

const issueVerificationOtp = async (userId: number, email: string, enforceCooldown = false) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new ErrorHandler(500, 'Email verification is not configured on the server.');
  }

  if (enforceCooldown) {
    const [verification] = await sql`SELECT last_sent_at FROM email_verifications WHERE user_id = ${userId}`;
    if (verification?.last_sent_at) {
      const elapsed = Date.now() - new Date(verification.last_sent_at).getTime();
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        throw new ErrorHandler(429, `You can request another code in ${retryAfterSeconds} seconds.`, retryAfterSeconds);
      }
    }
  }

  const otp = randomInt(100000, 1000000).toString();
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from:'Hirevix Team<onboarding@resend.dev>',
    to: [email],
    subject: 'Verify your Hirevix email',
     html: `
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <title>Verify your email — Hirevix</title>
  </head>
  <body style="margin:0;padding:0;background:#eef1f6;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

    <!-- Preheader (hidden preview text) -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
      Your Hirevix verification code is ready — it expires in ${OTP_EXPIRY_MINUTES} minutes.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f6;">
      <tr>
        <td align="center" style="padding:40px 16px;">

          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.10);">

            <!-- Header banner -->
            <tr>
              <td style="background:#0B1220;background-image:linear-gradient(135deg,#0B1220 0%,#151E33 55%,#1F2A44 100%);padding:0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding:38px 24px 30px 24px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                        <tr>
                          <td style="padding-right:10px;vertical-align:middle;">
                            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACXCAYAAACSsFA4AAA1Q0lEQVR42u19d5xW1Z3+8z3n3vuW6QPD0FECiAMICMHugCJiQ42+uJoYNbvR3fxiNHWTbLIvk4272fTEXTeaZKNmTQxjQcXEFmVirBELyoh0lD6NKW+55Zzv74973ynUKe+8M8CcjyMfhrfc8tznW85zngMMjaExNIbG0BgaQ2NoDI2hMTSGxtAYGsfLoKFL0PPrxRz8bVmcqqfVEgDE1lbwMgDLllUxABCBhy7XEAB7fD2YgerqmOj8y1isggVV6Z4gipkJWEaoriWU7fWv8/z5GqjiIXB2DON4PnlmEKpjAmV7CfPna6IqTQQA1epgr6+shHFKZJKcOWOEVTEyXJhXUlAajYQLXI91Kt3WzFokEjDdN9bt2kdEKWB/oNUgYEfo5ysN1I3gZWuruaoKeogBjzvArVJEtD8T0as/WzymrFSemHa5VGk9LGTIkWFLThCCyl1PCxCMkClLwqYYHrKMkVJSlDW00johBCkpSCjNjcy8QxAlQJS2Xa5VWn9Q36ref+6VD97//F21bV2+tBMgEavWxxND0nEDOgC0tCuzPf7DyuFzJpScVRg1zwLjJFep4a7HpWlHuc1tzvbWtNcABoUsGQbDTaRUE4NVOCQLSgusMcMLQxMjIVlMRJLBWhCFDElhIYWAKQBBQcLo/+kkXKU172DGbq3x5r429/ntLalXTr/5qe1djzkmUQ1gabUmHNtgPGYBuHx5TMZiAFEH6Jb/85yis+aMn5cXMRYLwbOJabJliLFWSCKV8ry0q/Y2J9wt2/cmVze0OJtHDguNLCsKVwhBpBluNCSHEUEQw4iGjXGWJUokkQGwYIYifxgAMzOYiJiZgYDRiCGFJAOmBEwBpD2kU94+T/M6ZryaSKvnn6vZXnP9na+3dAHjsgqmqio9BMDBznYAYXlMILZcZ8Lryv84u2TeSWULoxHrckPwuSFTjoMp4aY8aOYkgW0wEQiSmRUzyJBCApCGKSKwZMdVImqnVXgMKL0fP/ER+Iq1ZsCvcEiDQBAkYQjAEICnkWy1t3oazyRt7/HvP/i3539SvT3lf2VcoLqWjjVWPCYAyAxatapSLlhQ42V+t6P68nOK88PXS4GLQnnmWAiCTnrQWqcB0gALIhJEMIUgAlHXq8EAFHOm6bI//QiAmIio709N8B2kQSxgGQKWBFIeUil3vePyn/Y0OPeedNNjb7e/ZXlMHitAPNoBSC+80AG8WxdPCsX/afa1kYi4KWzIc0XEAFIulGInOFspQQKi03nz/mDocnUG4PqwBncFo9Ocdh1PP5+21f2f+926h6qra50MEPfPawcFpmLLBarXMnDktOGoBWDni//bW+cVLlk0/jPhsPFZK2pWAAyd8hQADyCDCPLoPNEAjIIMRCSggWRL+q22tPr511asfvC++7aliQD9hwEHog86AKheqoIIgatiy2V18PdjBoAcjwssA4iqdLyiwrrteyd/Nhoxbw/lmZPgaWhHOWCQIDIGhsH6JbllUJAFmEICQDLhvtuaUneO/MTDvwagmYPrkrtixQfd3jJCzQIvA6arYzHrjaLPLZL29qumF+qvrPjvGxoAJoD4aAcgMcdEpqrds+LKqwuj1r+EC0Kz4CgoVznEEELQsd1cZ9YAaZjCAIC2hPtaS9L+3pirH1vRXjVTv+WHB4AOAE6PfTGy3jvj7DZFSxRb58NtOxl1b/5Qrf7RVxFbLnEYFqSj45rHBYkqDQbW3XvZKePKI3dEC6xLoRnKVjYB8pgH3kGBCAXLMKE0WhLuil316fjUG59Yk2lDLc1KWGZCrPoA0M2Zc7O5Yfz881Ne+DKl1CKW4UksI0DzRoiGNz+a6n1QUVtbkzhIpn10AZBfqDRoQY0Xq4B1z/eujkej5hetsIyolJcmghREJo7joZm1IGKEDWknnGQi5f34S4+8ccd9921L975ICUDXKacDgAmVN4QbSxYvTHvWxZ5SC2CEp7IwAeUB2mVqet9BaldIQt3uvf0/P0Nl3EBNlXdU5oDMICBORFV63f8u/vj4UYV3RgpDp3kJxwbAhiALRAJDIzMUGAJRg5LN9updDanbJn3qiZf6CrpTLvhy3kbr45U2jCVa6/NhhCexsADtAp6tIaSG9gQ1rAHsBiLwpnJDzdy1elQaqGIcIRUYlACMxyEyE/Q7ll9+e2lh6D+ICK6rm8IhWWoICg3h7eBVs6s4bZoymrY93dTixXc2OT/++D+uTGoGHZgXHhx0ZZXx/FTRtMVpRZdoRiXL0IksQoByAOVoEGswC0hLwE2AGt4G7GYFM0+S13KDXvOr+4+U+w1aAC6PxeTS6mq1PH566bnTR/0oL2pcb9tqowZzSWHoBEOKMGse0pEdAoEK8OoaUm+3pN2tWmPc1t2Jex98f8t99967zfZFDkyoXCYxYhp3BsiwJf9ZkMTExY5Hl2it58PKn8AkOoEOGkwCBAEwICwg3eCDz0trGFEBL/kWv3v3XMTjQDer8UGVuGcS54fiZ0+cPbn0vzUwdU9D+s+lxdbEYfnhjwEgVgwaQt+h2jWQhjBKhkUmbF2buOuMLzz78PdvqMhLJvM0zb3ZQGyhRjUp1MADgGFn/mdBa9GERS4ZSxo9Pg9GdCybElA24KZUMIctglQnaN8H4EtsBzW+50/iCAOAhmD32wrQqK2V3S+rB02Lxc/3HvzWWTMnj8v/GismEpSsOKHosnCeNQKOYgwJaLuTPDMsSZpJNzerfy1d8vs7Ov9z4enxUmf4tEtsJRYBupKN6DgII2A6VwV3Q+CAxzy4/MIANW8EmtcDZAAgBWFIeKmX+d27zwLiojszIIMGgBxEUyLwn743/5KCqHlNY4u9afyIyIhpHyu5wTBknnYVCxrivSNXxATti29YWppQCKDR+b/PPHRS/PebZpzhGcbVimkeG3mjIWTX8IqA5Q5FreRHXmqqBdo+BITZ0Q6ShhBOYoFa++tViMUkqrtfedNAgy8QX4o1v1z8NcU4d+NHrc/PmVo6+8RxhdfBY2ilWYgh8B0JdJIAMj3AUIAnsam+kJ/aOpKf3z5e/OmDgmRaFkZZBOFVecpffHA40HUGnwFoB1T/DpCu80Owr/xRkKaEm3iK3/vlRYjHBXo4EzNgOWA8DkEE/bNbJ4UunTf1JwCdsWVX4k/zTy2/enh5/mk66bIAMAS+w4GOIUwPIgDd+voi/GnzKDy2YTRe2TmM0skwAawQVlF46Y7wSiS7xz3sM53TCqp/G3BbO8DnfxaBPZbs/psHALW1Pb5XA3JzM4T+01snhS6aO/XnlklnfLgn+fyMScUXFA/Pq0DC0UM9voODzhDss5yhANfA+3VF+OPmUXh84xi8urMUTioECA2YHgzJYAYUg9Hj0i0oNlJ7QQ3v+H0/MjrAx+zBCBlwEyv43Xuu7GnoHUgGJMTj9PnGB6yzKyb+q9JcsaPOrpk1pfTiguLQZJ1wtBgCHxgAdwKdsDwI6YPuvT0leHKTD7rXd5XCS1s+6CwPRtQGsw9YT1MviSYAX9s2UGOt//bO4POTdgHlupK9OzwAqO7deeYcgPE4iKqq9Mo7KmNpV0/Ys6/12XNmlt+QXxyeqBOuFuL4Bd/+oCPLhZAacEy8vbMUKzeNxhObRuONXSXQtgXIgOkODrpeHoEASIL2rQOaNwUtFuoKPmYFIyzhtD3qvfe/b/SW/XIOwKDo0D/7p1PnJB1v7Ob1iSduXHzCt/JLIxPR5iohSB6PoNNM4P1Ax7aJ1TuGY+XG0Vi5aTRW7ykBbLMfQNc5MZIAaz/kJnZ0yvf2m0AhIig7zSodB0Corui18oZyDD7+6RfmTs8z5Zmvrmt8+/ufnfHvpeX55yPhKhDk8Qo6mB4gNXTawt92l+CJjWOwctMovLO3GHBMQCrAVDAEQ7PPkpztIxIm4KX8YsNu7FpsdL2RCkZIwk3cz+/ec0Nf2C+XDEhE4C9fOXEEsa741R+3vvBo/KzbSkcXnI9W57gAXxfQSYa0XEBoeKkQXttWjsc3jsYfN4/Ce3uLAdfoAF3UbgdddpjuEPme3eSDz0seGnzwpb5Qts1K/Vtf2S9XACQA/OVPnZJXFuE5t9355gtb7r/s6lHjCv+fbnU8Agw6xkEHBqTUkJYHCA0nFcKrW0bisQ1j8MfNI7GuvsgHnaFAhoI0fdDpfgPdfuBL7gI1vOvPJAsThxSwMGsYloTTehdqf73RZ78qNdgBCABQyVT58+sS77119+LZY8cX/ASO0oJZHmsTuweCzgUEI5UM45UPR+CxjWPwp80jsaG+CPCkDzozl6DLHCX5YGvZ7BccQfFxGPUUQ0iCl25hL/WDbLBfrgDIn7qgPG9Hw769t1wxtaBiYtFvDCFC2vb0sdJkZgA6AI2UGjLkAsRItEXw0tZyPLZxDJ7aPAqbGwoAlQGdB2l5HaBjyt3RkgBA/rRay5aA9QiHle4xK0jTgJe6E+se2NUdsemgKEJiMciK1JxQ1crVyeSTsScjpZGLdcJV4ijP+/YHHSwPIKC1LYwXPyrDig1j8MzWkdjWWAAoAQQzFoLQDroBOWqSgFagxjVAcvfh8r3O79Mgg6CcXWw3z8T63zWgXRozyBnw7JGTjNvuXJ1seuQTX42URS9Gi+MJOjpdubgTcKQRMB2A5tYIajaNxooNY/Ds1pHY3pgP6AB0ltsFdJoH8JERJuAm/GLDae4m+AAwNKRhkJf4Ma//fT0qpxgZSdegZsB4vNKoqqrxdi+PzRhebr4uQQZcLY+m5ZLtoKOA6Uz/uje2RLEqYLrntpZj175OoBtwpjtEsZERkCr7wJmNI7PfR5zaOgMb/9SaLfbrbwak+QCqAFGUR3dKywgH/T46GkCn2HfrkFJBmn6hV9echxc+HIcVG8bgz9tGYG9zPqDJB10ow3Q0wEx3CPAltoMa1wKsewA+AEwMKQS79vew8akWxKolqpG1RfD9BsC7b55jLKiqcfet+MTXw8PDlWhxPAzipZMZthIECEPBMBWggT3N+fjzthFYsWEMXvhwBOqb8/w3mAoy5IDIB+vgAt1+lW7zBtC+9YCQR6p0D2Q/aUi4qS2wd/0vwIRqyurC934BxPJYTMburvbOnb9kdF5+6F+Q8rQvARpsoPNBkwGdMD1AC+zcl4/ntpZjxYbRWPXRCDS1RAPQeZBhBwiYTvFgtQfKVLrw+3ttHx56Wu0IuR8JU5ii7bf2xqfsbLNfvwFwbcVeWkrgxJPWD42omY+kq/zFLIMXdB81FuDZbeVYsX4M/rK9DM2tkQ7QRZz29w5e0HUGXyAgbXgHSNV1v9g4MHZLU6eS/zBt29/eQ1FxpPWbqacwyAH4QrzSWFBV4330uyWnhaPW3yHl6oEG30FBpwS2Nhbgma0jsWLDGPx1exlaW8N+ft0ZdJqg9NFSM3USkDa8DTitvQUfiJi1MsWSGc1bPjmrYdhfCiYtfPHluj8DsAczANutHMtKQj8SliSkPQ3kHoCdpertqmElsamhAE9v8VXDL+0YjkRbxPfNsTzI6NEIuv2KjdReUMMaQDuHn1Y7LPgA9kiU5Lv6rk95Uxt2l59rv7f7EVmQ8AJlKw9KAMZjFeaCqhqnbsWVS0IF4bN89std7ndIqXpDIZ7aPAqPbRiDl3cOQzoRBgIViozaQFCAHH2g6zSEBbRu82c3DiYg7cGQBLg24faLUxg+UkthF5y9ddcHP9+9l2l+RVkeausSg7ENQ6go0wAo3zS/CgEGEecMdKIT6A6Qqg+Dk8xI1VUXLd1RDbp2Aak4vIC0JzgmQLlAeTnjC/PTQjcpXTosPOX/fWLKgjvuq1WzphYPGzu+6K0HntrY0qcvyjYAf3brJOu2qhq7bsWVS0JF1tnwDSJlf1zyLlL1TqB7b09JALrReG1XKbzO6yOyLuAcDMVGNwWkPQy/yiZ87bwUiksU3FaCMIHJowtvnj97RF0kYoTTbboOQO1gYkB6c41LAJAfMr9EUiCbxdKBUvVgfYRj4p3dpVi5aRSe2Dgab+wuhUpb/agaHkz5ngF46SMLSHvKfg4wbrTGzWeloVMEQ0LA9nRhcejkBaeWn/vq+/VvFRYZIysrsb4mC9NxWQHg5yor8u6qqU3uePCys8ywcQ6Sru4r+x1Kqg7bxOodw7By02is3DQKq3eXgvtVqj5Iiw27ya903WRWwNdefDiEbyxMIb9QwWsjGAL+qnUinDAib+HmXYkdeZYROq112q4arH2/r0VJnwE4Z84cs2BM24kA3i3OD98s80yBFsfrTetlf9BJy22Xqr+xvQxPbByNJzeNxlt7igOpegfo+lc1PMh6fMndfqV7JAFpT9nPBj42XuOmM3z2kyLzb0RwFOdFzPGnTipZtHdf+iMmaq6sxAbxF3h9+fpeAzBY44ErZrtjvZQx7IGvnz0xFJJLkHS5t+xHgiGlvz7CS1v424cjAqn6aKzZWww4uZSqD1LwpetAdW/4wOvRtFq3Wi/41gUphPN0O/t1jfpkjCgJzRAC+c1J78O2j0rymJua+1KM9JUBeWJZ3mnrPmptOPOUkmtkgVXc2wVGmoGWtInahmF4dMNY/HHTKNTWdUjVYXSATh83oNuvxcoasIqAUAngtAQARNbYr+JEjU/OS0MnO9iv09cTNMM0ZV7IFAVKKRURIWtAckAOFhn9+tZZZeNH5J3TmLCfG1Ecvhae9imph0JnDUBJxteem4lfvjQNsFxfNSx1jqXqg31oQIbAJVNBe17POvvFFyVhhjW8xH7s13HjWUiSlinDhVFz5OXnlc/LR/5zT23c2OvZkd7NUMTjBACjRxefaZk0bPoJJdPDYeNkdhR6Y6lBAAwGfnz+m/jqeW/7uZ1gCMHwNA0STd0gYUHtAqFSIG8UoD30VdIpBeClgdmTFa6aE1S+R7iDYVMUlRWHJ04dX3R6xTQekSGl3AEw2BXcMmlyfYu9ZfLo/NNE2DBYs+7lZQVpQr7U+P6Fb6D6qhcxzPKg0hYMoYdwd5AEnPPGBoqXLLCgJixblII0GYe9g0EYNgwRKcozx4wti86YNmn49PYKMhcAzITfWxdPKgyH5CQpBRflW1OgGH16HCkoKBIhXD19K1696WmcNX4vvEQYknIyqXIU5YLKzwWtAj8v7OVllwLwUoQzTla4bLbdpfI9LGgEibywUTasOHRCWbE1DYDs7R7HPQbgsrh/tjOnFY/3XBbDC0MjI2E5Hq5GX00kCX77xUuGMKmkFS9c/xxuP6sWyrbASkCKIRB2lKQmYBX7YOw9kQIAvrMoBQqctLo7TEPkFYSN4UX55omxygllvQ3DPQcg4gCAEUXhSa5mHjksMkWGjZDW2dMDG4KhXQOGJvzkotfx4FUvosTyoNLmUEjuXBGYBX3K/VSKsGC6h4Uzus9+6ECatAxpjRoWmX3tgnELOtcG/QlAEr4DpjxxVMFlY4ZFJhZGzXHQnHW9lQhCrpcM4ZpTNuOVm57BGePqhkJyFxSF2pXPvWI/CXznwhRAPWO/IAyTYSBUUmCNPmFkfiUAIXqxT12Pjj4e93ecu+fL88ZDoNwyBYUNGoZ+8g/vCMlhnFTaglXXP4dbz3wfKm2B9XEekpl7Db4M+10008PZFQ5Uugfs1+nmCBLhvJCRP7w4NO/38dPGs48R0W8ARBB+i/NDZXua7G2ep1NmyIhCa+7P1W6G0NCuAYsJP7/4NTxw1YsoMhSUfRyHZAoa073ErjCA7yxK+jMAvXmOffwbUpKZHzZOOGF4wSkAsGxajPoNgMuC9ktb0g5t3NlWGzKFRtggzf2/SkKQ/yVeMoTrZm7GKzc+jXmj6zuF5OMQhNpBT2OnIQCVJFwxx8XcKb1kvwyT+iIFwzBEqDBqzchJFQwAeRFrrNCszGDv2hw2INpD8snDW1Bzw3P43OnrgpBMx1lIJpDb1qMGHAHQGjDCwLJFqb50cDIsTCRImoYwiguseQBIXNMzr0DRs+8Dx+MQza12mgW8wqh1IpTO+YKPTEgOg/Hfl76K+698CYXyeArJBLAH2M09ygNlwH5/93EHMyY60OksbCXPEIKgtOay7908p5C5Y++XbAPQ/9CtMwsTaY8cj5sMSWXQDD0AbvuCGKwJXjKE62dvxEs3PoM5oxvgJY/1kBwooZ02wG3utiKGACgFhPKAb1+QAnvI1jUiZnimIUacOaW43M/V4v0CQAaApEyr597c++5JowukGZKlcDXTAO1iRNQRkqePaMZfP/0sbpn3wbEfkkmAEjt6NBcsBaBThE+f7mDKBBfa9l0gssEFAHshk4aXlFhTAADTavsFgP6JpC3jydd21I8rj5oybEj47igDOgyhoW0DYWL84rJX8JsrXka+0IMgJHM/sV9LsAbE7BH7RQuAby5Mgp2ssR+IAM2siEhEQ+aE/ixCfEsk5RQBQFGeWZ7dFaJ9fAyFH5JVMoQbT92Al258BrNHNvohWeQ6JAd90SwKRrsUH/s+8FUxPWS/z55l44QxHrSTNfYLAEQkhDAsU4zv9yrYgCEBKMsQ0eAsBk2cI/KXZ3rJME4pb8Jfb3gW/zB3PVQqlyG5wxoDTkvWJPP+/G8IaN4ApPb0jP08oLAY+Nr5qayyXwZ7UpAlBZkhS/g5YKz71r09zgETjkoCUKYhxge/GnTpvhGE36jQ+OXlL+NXS15BXk5Ccma7gySobjVo798Au6mPyyWDZT/CBJo/ALVs6hGopQB0mvC5c2yMHulBZZH92o/QPxTNmov93yzj7hNaD4fLLQ4Ax5A0BvDVzINxayMZhGSdDOHv567HnFGNuOHxM7Bm5zAYURsqWPyUXfBlTCDfAVQagADt/Ru4dBqQN9ZXrrSrV6gbuWMAPGWDmt4FEjuDhefdjwjKA0qHMb60IAlOI+vg05p5y87WP7ekvFbb1ZuC9mC/AZBSusAB4DLgDvb9o4l8mw4vGcaskY14+YZn8Pmn5+LeNycDIX+Zp87WLkMHNYH0H1FqWAOk6sCFEwGrMPi1OgQrBrkjSb/Xl9gJat4AuIkeh3NJgJsm3H5JGmXD1YELjfqa5RKBmdX6j1r/vHVPookJPV6g1NPD4ZkTlOP34XDU9DgyITlPavzmipdx95JXECGGto0+huTgEmRMIOvXBBiSncAV+LQkdoL2vObvuZvcE+w+Kfz3Zn4yfi5um799wp7Xg81jUj0GnyDAc4HyEYxbz02B0+h703n/ilQzkylkcb6ZWrOtaUNTm1sf6yGmesyAp5SOUcBG5GL+t19CctrCzfM+wKmjGnHT42fgvV2lvQzJnbY7OKIJJHcAKLEDlNwJyDBgRP0/heGzprb9BRpesitAe9HSIQLYJnw1sNjIJvt1zv6EZYjS4jCefmX3jiVnnRip6OGB9npZ5tHEgF1CMhheIoy5oxrw0o3P4PNPzcVv35oEhBwIwd1cANXZBHINkNrbDXeCTmwJ+B4YKh1k8J3kbCQC4Fm97iV2WGwwbjk73TOxaS+GKWXr9sZUfRN7BXf18IB7fFjzp43gfuqy5jwkF0qF+698CXdd+irCBF+FfcSQnNnuoA209/VeOJByR2VLRhB+rU5hWHZ9XS8fNHYIXz/ft9jQqp+y9aDYKAhJG4A9VlCPl2f2OAc8yAcclUDMhGSVsvBPp69Dzaefw8nDW+Alw74XzeGKjVS9Dz63rY99Pj7ET+9HZ4uNz5zZ/+wHADKIo14o4aG/GbAD/Ue/7KS9cZ0IY96Yerxy49O4buYmeMmQ77y3fzdBWKC2D31rDO31yQSyP8+JPcK3FqYRztP9x34MBkGotOembGcbABSisMcrpHoPQM0GjpFhCA2VNlFkKDxw1V/x80teg8XUKSQTIKQ/BdbwbkeeNsjAl2G/k0/U+ORph7DYyC7aCYq9NsdrAADsLdP9D8CyvQQAivX7We7kDoKQLKDSFm49433UXP8cTiptgZeOQAgG6tf402C9rEpzx34C8QtSMMMaOgc6OQZTnuXX19NGjOD+B2CGAEH7stpYGhQ3kP3GdSKM08fW4ZXPPIMrTtoIvf1tyNRHWfPh65cHiACVJsye7OHqud2z2MhWPzBk+ZPssYqK3AFQEjf12Q1hEIdkzzZREnLxuyUvY1RePViFDswJB9XT47cSly1KQVrc2/VKPWdAgtLS1ACwrDdpQ4/fUefTrJS0Da72D+EYHIZguLZApFDiXy50oG0atCrrjMXG6RmLjWT/V74azLAklOLNY5Wxiwio6u91wQCAtT7NKocatKu0b1OJY1J6bEhAJ4G/PzOFyRMUlJ39yfzs5GH+6I3FRq8LHpCGIUCgdbS0Wmkdk737nJ4yfZW/NDNvV/G7ylGbEDIIfHRWIxlL4EPNfhD8sBbO0/4qMm/wsWBmodH86R4u6KnFRjbCPvMeAMCqvTmzZ/MTv1vucRWQOloywAzYPO3/KPZX0gvDg7C8w95gnSRcMy+N2ZMVvDRyd4O7c159tNjo0xX1/3uvb0zam69eHtCtxnt+qUWDqimd2e83AzZmAgV7ihgRB0bUhgy5UMzYsq8Yf/uwFIfTVrAGpMn47uIUkHUdYR/ZL7DYOOfkHLIfgyFIqlY73dSaftFnwPm9wkDvmslBL1BKWg2B6waS1TgAhK9P8/V/ZGh/d/PMZI0n0ZoMYVtLHt5vKMCa+iKsqSvEhpZh2LTFxrUVb+PeT/MhrWkzayounmWjcloYNWsNGBGGGuDHjrXflqxalPTZiHKKflKul95Ur3YB8E1Lq3IFwKASVqxrjZQHysEu6MyARgf7CAKE0CBD+Za+FNwB28Sulig2NOXjvfoivFNfhPfqi7C5KQ+7ExHfaZ8BSBOwPwLq3sXNc5sAPvxJMAMgxh0XpXDO+wUDzoKGANwE4crTXHx8igOVzGnup2EICfDb3p62Vo5DECGHDBir1gDwzgetL8+eUrjTyjNHa0ezyAIQ21ktuOkEf5aCZMBqsoPVkmkL2xqiWNdYgHfrivBuXRHWNRZiW0sUrakQ4AWFmQjeJxVkxAEJA6KlFl7dekwZJzDvRA0+gkdKJtyddbKNy04N4/HXTRh5A8eCGYuNqguzYLHRmxBsCgiI9xZU1Xj8QqWBqprcAZAIzHEIuu2plvRTS9fDEKOFq/u0O1KmEj0oqzkG9iYi2LwvD7X1RXinzme19U352NEWATsGoIX/+gCkZHqQQXHh75wEMAkoBqhuLSi5DdoL4eqZaRhR3T3BZtDs/e7iFP74jpmzZu+h2O+T5/gWGypBuS2MCAJpD42J9BOdI2LuGBAA5lcKVNVoSXgJppyPpMe9fQqZCcLwAMlwUhY+airAB035WFNXhDV1xahtLMDW5jw0J0P+viFdWE1Dhtz2JcrMmbyQ4HEnXt1vF3ElLcgIY+lMG/C619/LTHfNmOjgk6c7uG+VBTOf4elc3ntAaSAUzbrFRvfZzxBC2aqpKeW92Tki5haAAerTaa6Jpr2vi17uiq41QYRcvPLhCFT95RRsbI3gw9Yo3LTZwWoB2Mjw9w3JsFomXCs+3AL5A3cRl4YFLwXMm6IwY5wL7oFNBRHALhBflMLy1RZsDzldny8F4LYRrj/fwUkTXKi2nLOfhikkXG/t1E+urO9L/tfrNkxn1D/0yOsvqoS7G4YQ6OE6EQbAguG4Bj7z1Mfx9AdjsampAK7yQWlEbRgRB8LyQMLvcXXu42k+0rqAjIC0rouAlMCAAq6Z5QAWB1Pa3bxgBGiHcOJYF7ecndvGL5FvsREpAP5lYT8sMu/BRUh7/HR7JMx1H7A9D1wekzfdty0NQX9FSPqdwR4MpQky4uBHr03Fup3DYBUmIaQO/EY6+nhHBtqhzi4jIH0zWORjgMDwFBAuAD4xwwGcnk+v+Qt+gK+fn0JxKUPlKAxK8ttB/3CWjRPGuFm12OguYYAgdcJxG1tTD/oAnK8HBICd+4GtCedRP7vvWdEhLQ9b9pTgjpcrIEIuXCV67Rjb9TL5a2tp37pAQNrh0yKEv1rs3MkeThjpQbs9v4mCAO0Syss9fHG+nR2fve6wnwcUFjO+fl4KbOee/YhZw5JgxuZNZS1b/Q0rqwYQgPNrFADsc1ue0km3EYaQ3Q3DDF/Vf/sLM5FIhUBSZyGP4nagUcM7QPPGgwtIGbhutgOWjN5uLiECNrptfgqjyhme279CBUm+xcY/ZSw2XBoAYQQxpEDaUfcvWFDjYVVlnx1yRR+fSmaOyY8tfa457erHgzB8xHUBShNk2MHj70/A47UTIMMOlKYsgM/wbSzq3thvC/sOFvE8oLiUcUmFA3J6v1ibyF8WUlSs8I0L0mBb9BsjEQHK9S02vrwgDR4oVQ5BIOVCE1ZkI/z2nQEBoNr/oy3p/QqOwpE2qmYAJDUSyRBuf34WSGSJ+YQJuC1+sZE++Bb2kgDYhMUnuxg+3GeRvoCm3fbszBQmje8/uZYI2O+2ShtlZQPFflCImLBt7y8Fkb3rmeOir+E3KwCkpdWKGTRCy1fthLsaIUmHY0GlCSLs4o6XK7BlTzGk5fVxN8yg0k3u8cF3GBuLjH772tlOVtomBN/iJZyvsezC/pFriYD9yssZX6hMgVM0MCshGAxJpIFf0IIaD6tWZaX2z04DYVWlpKXVKuWpu2Ac2jNBM8EIeVi7fTh+9PpUyEhfQi+3V7po2Qyqf9OfnzqEKSQFXimjyxnnT3FBaYLIwtkbgVzr7+alMWuSgsqyXCtjsfGV89IoLlE5q7i7XmpmWEI6TekPW1vxBDMok/8PDgDOr1HMIDLFCrfZ3gnz4D1BDv7/hednwbFNQPTWYCbwZSEJaloLaqoNHKUOvVQyE34vn+4ir0hBZXG9bLtc66IUWGfPsyRjsTF2FOMfz0rnVmza9TFQCBvkab6vfGl1G1ZV9np3zH4BIBEYqypl8eLqRuXp3yBqkuau2zj6PT8bD6yZiOc3jOkD+wWVLmuf9Vq2dMtHRTMAE7h2tt2NMqnnuaBKES6ZaePc6R5UloCSsdj4xsIU8ov60WLjSBdckPRanNaGNr6bAcKqmqxNPmbveVpVo5lBSce522tON4pOLKgZIENjX0sUX111CoSheilnyjiQpvx8L7mnW0slM0xy0hiN0ycGU28i67cJEIw7Fqd8vxLOAvvZwMRxGjedMZDsB42IQa6j7hu/tHoHlscEVWHwAZCqoLGqUg678rGPHEf/AlFTZIoRZoKwXHz7rzOwq7EQZKpeFB4ZB9JG0N7XALv7/suCALiEq2c6MKMaqh8WbGdY8OwKG5fNdvusz8ssMv/WBWlE+tNioxuFh0q59ua65A+YQZlFaYOPAQFg1XzNcYi6Bve/VIvdDFMITxPLkIs3tpbjf1ZPhgw7vXAl7eRAWveGT2ei+74sSgMiEsz9ev3YQwvkWv+2OAUj1Ou9BDssNk5Q+NRpuVtkflD2CxnCSXv3Tr9h5YeojgmqqtKDFoBUVaUxv1KccP2ju9Jp9QNEDAFizVrg88/PhvJEDwuP/RxIG94Jvqj72x9I8n0f556gML2Hypces2DQr5v5MQfXnuarlHsDnIzB0L8u8i02BkR3yGCYRCrpNu/al473B/tlnwHbK+K42Ni476epRnuDUeTJX6yepF/bMhJG2O1B4REUG+Q7kNK+Dzr5LnOPbiYU4ZpZDqiHypfeh07foSCSjx5X2xnN4azJCrG5A537mSKd8v7jY9c9sac/2K9fAEgERnUtzfr0s4kIJ7+yu6EI33xxBkSPGs4ZAakLqlvdyf62xxGxXfly1Qy7V8qX3oRPbRMmjnPx2d7ItdotNtI5tdg4oLEUksJtTL2/bkfqTua46IvoNLcMCH92JBZbLq2LHn/8qgdn/mmfWyJYKKW7K1Po4kBa32tToM7KlwmjVM7kSxm51jcXplBc0n25lm+xAZw+VWHJrHROLDYOfgtIwxTUZqtvzL1lZRLVtUT9ZMncP6cXj4vq6ph2F/zXhJd3jJlFlGLu1nd1FpC+lgUHUv+t1852wIKRKzLpLNe6rQdyLQ7mCqsuTIEMHpiVdwyFQstwmtIPlV7+8GPMMUlLq1W/Xat++dTaaQQQwyj6qciLjmLl6W5xgLCA1m1+2NWqTw6knZUvl/ZR+dJrEKYIX5yfwshyhjqCXCvTxpk/3cOiXFtsdM77TCKvzd2zN+l+kRmEZdX9+hhk/xRjyyWqlyqcf8/lCJdcoe2kApE8fKXbISClxvey4kAqCSCbcOFUD8OH9V350psHQHtAUYnCNxamj+iu1W6xsSjXFhtdboWGKUWi1bl13FWPbvcLj/4NHFm22WVCBRhz4lGYhT8Aa/Z3c6XDV7qs/QVDiZ193FetK6yZgOtOtbPwab18CNp3qUzh5y+GsHkXQVg4QAQrBeAlCYtnezinws7aVF7PuI895FuG3ZT+RfHlD1UzxyRR/4Xe/mHAylUSVaRReuK3ESqeDOVo0KH2lGe/maxsf1O/LuDre/hjDxhTrnH+FAfkDEwyn5FrRfI14odx18pYbHznwuSA9FugWSNqGm6rvWZjG9/me/9U5yRlzt5tiS2XqFng4dy7Z8Asug1uWh1anBpUunYzaM9r++0o2TfgGcG+EapJ4NJpHvKKNDxv4GxcM+5a181LY2ZGrtXpYIwg97t8dmCxkWv2Y2aYAp7jJZtb3GumL612EKtgytFGRCLrD30476cwwhGwh4MXHhkB6W6f+VS6T5UuBTdZCH+Gzm0j5BmE6xY6+NrCZL/OfHT3+FgDMsT4t8UpsBbtJkKEwGIj5Deuc22x4RfdpCCFSDS7f1929SPreHlMZkPpnNscMFN4LPz1TQiXngc3cZDCIyg2hAlq2QzsW+fjv5e7igvyf1wF6AQBApg2TuP6eWlcM8fGCSM9wAEwCEwlMyx42SwbZ08L46+1vrsWwbfYuO5sB6d8LPcWG8TwUBwy2na3/XvxFQ89yC9UGrSg2sv1A9rXpp9AHMh7saQsERq9FiJU4rNfZ3bttLFf0/tA69ZOq9V6drAZGZXnAHAIkQLgogoXnznDxqKpDsyoAhxq35h5sDiaKg3ICOMvtSFU/rTAn+VgwCDCmn9uxpQxLjiX63yZXURNM9Vs/zJ60fJb+IVKiQU1inJcr/WdAWPTCFVLVXLR/d+FWTDsQPYLKl3tgRrXdFvDd1C20z6TAITJYxSum2vjkx+3MXm0678wTfDaBAQNLhfTzn2+c6fZuHRWGCvfMgENXD/fwUkn5Nhig9lFYchMN6afiF60/GaOxwUWVOUcfH0HYBB6jYV3n+0ZBZ+BlzoQfMIE3ASo/i3AaekR+GQntlMOwYwCi2Z7uPH0NC6Z5iCSrwHHByUH7GgMxu3bO1E4a+C7F6Wwco2JcIRzbrGhNXuiwDKdpvTjr+7afQ0vj0msBdMAGc0bfbucABCTniz6OaQp4KV1x5XsvIX9277ArRvFRqao8LTfGwMD40cyrp1j41Pz0pg+zvWDe5rgtVFgVImjYmSULjMnO7jkFA+lUY0Tx7tQLTliP82uKAyZdnN69XtbE9cuuKUmzfF4v6hc+j8HbC887rsd0RE/gZtUoIw/YAC+tu2gpvcCp8nDFhsMZg2CYI+ANFhESSyY4uGmM2xcNt1BYZECXF9pkmG7o3GDEs0AmYyte00YkjF2mAfkYpaG4aHAMuxW+69b97RdefInV9brLK3tzT0DxuMCVTGNBf81gcy8OCtHg1i0Y1qYQPN6UPOGQNN3KPCxBkNDCIOkJeG5OLFM46pTNV0zK6HnnOgJSA2kxVHHdofLZ+ESTixz/akal/r3SfJ3tfSQb5p2s31P0zsNX5r61WcTHB948PUegL7YQMO8/7ts5RfDafObzu2+LGuAto8OtbFfhu0IwhQgKaDSrUKlVnKLd9/Kr7Tpk6fiLpAxSTWxC5KmEDy4c7ve5IKej7p+ZT5mPyUqsMx0ferHkYuXfxkABjrs9i0EB6FXXvDri1So7I9QngJp2e5AWv8OkD7YLuIB25EwIC1/pl45rzH0w3Dsanxw31YB39+t5oeXj/v4jMiTkeLQDLQ5DhgmCMfklmD9GOs9hKShlNZO0vtq9JLqHzPHBVCVs1mO/mBAQkWMURGzlMz/EcAMVgRpAU4LqP7tQMPXDj5GRoYnTQmSAl6qDW7yMdb6fqy955kOYMekrgZeiO+lyq889tGOBy49jwTuCpeEY2ix/fnKQ84rD40uIRdQKAoZXsLdlWzz/rHosurHfXFBlcYg21aNesN+WHjvNxEtvwNOm4IRkkjt9RcMBSaQgGYwlM92pt97UPb7xPid9tJ/wPv3bmj/zMq4gRpooCMkdDK+oeTT13zFMsUyGTaiSLgeBBlDKDsU6bEWRISoSemUuzzdnPznkisf28pcaRDVeIPxmLsPwHhcoGoZW4vuOckxyt4EEIKQhNZtRE3v+x9FQvnSDkNCGICX8gA8ycr7LdrWP4ltNekM2wEAqg8t9+HA8pwIvG/FVXOjBdZvzAJrOlod5W99NMSGXVmPFSKm4aU9x3XUt6MXLf8+4O9q1Z+K5tyF4KDwcOn/fgIzGoGbVtS0TqBlE4MMvwEtDAkSgJvcAuU8yNr+A9b+5p0D2K666ogXJJOn8AtxgxZUvfHG9xaeXTGr9DuRiPkFGAJIuZ6vYj3Oc0OGgoBEfshw29zVrY3OF4bFHn7ZbzBXMC2tUoP58Lt38yrjBmqqPHnBr2IqMno5vJRHDe8SEjsAIyIhTF/VwupZ1vr3SDY9gs3VzQF1CsRqCdXVvc4/Oj/FjStil0Tz5HdDhaFZSLmAqz0WZByHKPSBlWdKL+k2e67+6asv7/7egqqatC8qGJwhtxcAZEIchGe/loeSM94GMJ52v0bwEhIyBHjJnWB+mEk/gDX3vHa43K5vHQUQqmOCllareKzC+ufPTPuKYckvmQWhYWh1fCYgyGMddX6eByBqCWiGk/IeaWnzvll2RfUH++XPODYAGBQedNFDP2ASX6E9LwNuAiDxIrH6vU42PISN1XXtYK2cL1FTo/qr2urMhtse+MTE8nLrywbRLTJqSiQcHezceSyGZp/xIoaEq+G46jnPUXflXVz9qJ+qVBoDoWbpXwAG4Atd9vAFjp14BntebYB2HmZhPoh3/ueFrq9by9liu+4cN3NMZNYsNK+86rRIyPq8aYlPIWwASRdQ7AEsjupihcFg9vPrPJOgGY6tXrGT9g8LL334kQzjYVlgi3IUDjr8vzFOWvLr/K0tjb+yGz98C6ktv8WGJ3d0sN0yiZqqfmO7IxfmcbFs/iqRyXdan4ydZ1ryRgm+1CgKl8DVQMrV8PvbRwcYfTMELQCGKQxEDXj7bE8DKz2NB/IufPAhH3hMqF4qBnOFm50QPOnWEDbeCQB2ewulGgAGz4kzxwWqaylzM7Y/evm4EQWRa7Xmq0IhYx6iJmB7gO1pMPnTgAwxaMI0c7AzIxiGMBAxAM1wWuydwhR/SCadPxRd+vBrQXcA+g+Du7XSP33AyriBmmUquFCDkzyWxyRiQKflhJR66u8WGhFxvrLVpaGIOQ2W9LVejgI0q2CyPseADADnf7dE2GiXQnsJp14xP2sQnlm/o/6Jihv+3HCwh+xYGdSD1x01yS0zCKsqZedWxM1z5pg//4+PXSAMOZc9XiDApxsFobBvxhcA0mMGQbf7WxMIYAIfsCU3HTR4HvA3ZlAANH/4xZElATPIBlIeXMXvMPOrkvjV7c3O0ydc9eiu9o95odLA/Pn6aKps+4cBj9Lz4+UxgbK9tH9fbO8jV0zJyw9NNwhnKoWZBuFUM2yUwpKB9X2wybCn/R/m/YqDzk7TLCD2yy+JfJAZwlfYMgNJD8wMx1HvCvDbQsqXEmnn7aJLH369M4B5eUyibC9hfo0aTMKBIQD2KbcHIQAjVs3X+1eNH9x7yZjS4dGRhaY82ZBU4XpqBCSNJcUnCiHGC0FhZh+FUgpCXqDuJgJsBZX2NAGC4fOl0khr8EZWvDYcNbYqV+92bP23tHbbvv7Eh7X33LPa7craMYlVxwfojksAHgDIeFxgWS35N/3QIa6yEsYfbv3EeGaKMLsMQ3CeJQsL88IToTTDEpRoc5tbmp0tVsQkaJddJQURp0Ze/ciWQ6UuGcBV143gpUurB51KZQiAOW/pQCxbFkeXHYCykHu1h1PA3+Q7VsGgKqbjFHBDAOxN6I7HCcsALPN/Vz2tlmIZUGWA1dk/OXgtVVUNlC/S0BgaQ2NoDI2hMTSGxtAYGkNjaAyNoTE0Bt34/zLcJdUK4mznAAAAAElFTkSuQmCC" width="36" height="34" alt="Hirevix" style="display:block;width:36px;height:34px;object-fit:contain;" />
                          </td>
                          <td style="vertical-align:middle;">
                            <span style="font-size:24px;font-weight:800;letter-spacing:2.5px;color:#ffffff;">HIREVIX</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Gradient accent strip -->
            <tr>
              <td style="height:4px;line-height:4px;font-size:0;background:linear-gradient(90deg,#F2B33D 0%,#2FD8C4 100%);">&nbsp;</td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:44px 44px 8px 44px;">
                <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#2FA894;">
                  Email verification
                </p>
                <h1 style="margin:0;font-size:26px;line-height:1.3;font-weight:800;color:#0B1220;">
                  Verify your email address
                </h1>
                <p style="margin:18px 0 0 0;font-size:15.5px;line-height:1.65;color:#4b5563;">
                  Welcome to Hirevix! Enter the verification code below to confirm it&rsquo;s really you and activate your account.
                </p>
              </td>
            </tr>

            <!-- OTP block -->
            <tr>
              <td style="padding:26px 44px 8px 44px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #ECEFF4;border-radius:16px;">
                  <tr>
                    <td align="center" style="padding:28px 20px 24px 20px;">
                      <p style="margin:0 0 16px 0;font-size:11.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;">
                        Your verification code
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                        <tr>
                          ${otp.split('').map((digit) => `
                          <td style="padding:0 5px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="44" height="54" style="width:44px;height:54px;background:#ffffff;border:1.5px solid #E4B95E;border-radius:10px;box-shadow:0 2px 6px rgba(242,179,61,0.18);">
                              <tr>
                                <td align="center" valign="middle" style="font-size:26px;font-weight:800;color:#0B1220;font-family:'Courier New',monospace;">
                                  ${digit}
                                </td>
                              </tr>
                            </table>
                          </td>
                          `).join('')}
                        </tr>
                      </table>
                      <p style="margin:18px 0 0 0;font-size:13px;color:#9ca3af;">
                        Expires in <strong style="color:#4b5563;">${OTP_EXPIRY_MINUTES} minutes</strong>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Security note -->
            <tr>
              <td style="padding:22px 44px 4px 44px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#FFF9EE;border:1px solid #F5E3B8;border-radius:12px;">
                  <tr>
                    <td style="padding:14px 18px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td valign="top" style="padding-right:10px;padding-top:1px;">
                            <span style="display:inline-block;width:16px;height:16px;line-height:16px;text-align:center;font-size:11px;font-weight:800;color:#0B1220;background:#F2B33D;border-radius:50%;">!</span>
                          </td>
                          <td style="font-size:13.5px;line-height:1.55;color:#7A6416;">
                            Never share this code with anyone. Hirevix will never ask for it by phone, email, or chat.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Fallback line -->
            <tr>
              <td style="padding:26px 44px 40px 44px;">
                <p style="margin:0;font-size:13.5px;line-height:1.6;color:#9ca3af;">
                  Didn&rsquo;t request this code? You can safely ignore this email — your account is still secure.
                </p>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding:0 44px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="border-top:1px solid #E5E7EB;font-size:0;line-height:0;">&nbsp;</td></tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:28px 44px 36px 44px;" align="center">
                <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;letter-spacing:1px;color:#0B1220;">HIREVIX</p>
                <p style="margin:0;font-size:12.5px;color:#9ca3af;">
                  &copy; Hirevix. All rights reserved.
                </p>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
</html>
  `,
  });

  if (error) {
    console.error('Resend email delivery failed:', error.message);
    throw new ErrorHandler(502, 'Our email provider rejected this delivery. Please contact support if the problem continues.');
  }

  // Save the OTP only after Resend accepts the email, so a failed delivery
  // never creates a resend cooldown or an unusable verification code.
  await sql`
    INSERT INTO email_verifications (user_id, code_hash, expires_at, attempts, last_sent_at)
    VALUES (${userId}, ${hashOtp(otp)}, NOW() + INTERVAL '10 minutes', 0, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) DO UPDATE SET
      code_hash = EXCLUDED.code_hash,
      expires_at = EXCLUDED.expires_at,
      attempts = 0,
      last_sent_at = CURRENT_TIMESTAMP
  `;
};

const registerUser = TryCatch(async (req, res, next) => {

  const { name, email, password, phoneNumber, role, bio } = req.body;

  if (!name || !email || !password || !phoneNumber || !role) {
    throw new ErrorHandler(400, "Please fill all details...");
  }
  if (role !== 'recruiter' && role !== 'jobseeker') {
    throw new ErrorHandler(400, 'Invalid user role.');
  }

  const existingUsers = await sql`SELECT user_id FROM users WHERE email = ${email}`;
  if (existingUsers.length > 0) {
    const [existingUser] = await sql`SELECT user_id, is_verified FROM users WHERE email = ${email}`;
    if (!existingUser.is_verified) {
      try {
        await issueVerificationOtp(existingUser.user_id, email, true);
      } catch (error) {
        if (error instanceof ErrorHandler && Number(error.statusCode) === 429) {
          return res.status(202).json({
            message: 'Your verification code was sent recently. Please check your inbox or resend when the timer ends.',
            email,
            requiresVerification: true,
            retryAfterSeconds: error.retryAfterSeconds,
          });
        }
        throw error;
      }
      return res.status(202).json({
        message: 'This email is awaiting verification. A new OTP has been sent.',
        email,
        requiresVerification: true,
      });
    }
    throw new ErrorHandler(409, `User with ${email} email is already exist..please try another..`);
  }

  const hashPassword = await bcrypt.hash(password, 10);

  let registerdUser;

  if (role === "recruiter") {
    const [user] = await sql`INSERT INTO users (name, email, password, phone_number, role, is_verified) VALUES (${name}, ${email}, ${hashPassword}, ${phoneNumber}, ${role}, FALSE) RETURNING user_id, name, email, phone_number, role, created_at`;
    registerdUser = user;
  } else if (role === "jobseeker") {
    const uploadedFiles = req.files as Record<string, Express.Multer.File[]> | undefined;
    const file = uploadedFiles?.File?.[0] ?? uploadedFiles?.file?.[0] ?? uploadedFiles?.resume?.[0] ?? null;

    if (!file) {
      throw new ErrorHandler(400, "Resume file is required for job seekers...")
    }

    const fileBuffer = getBuffer(file);

    if (!fileBuffer || !fileBuffer.content) {
      throw new ErrorHandler(500, "Failed to generate buffer of this file...")
    }

    let resumeUrl: string | null = null;
    let resumePublicId: string | null = null;

    if (process.env.UPLOAD_SERVICE) {
      try {
        const { data } = await axios.post(`${process.env.UPLOAD_SERVICE}/api/utils/upload`, { buffer: fileBuffer.content });
        resumeUrl = data?.url ?? null;
        resumePublicId = data?.public_id ?? null;
      } catch (uploadError) {
        console.warn("Resume upload failed, continuing with registration:", uploadError);
      }
    }

    const [user] = await sql`INSERT INTO users (name, email, password, phone_number, role, bio, resume, resume_public_id, is_verified) VALUES (${name}, ${email}, ${hashPassword}, ${phoneNumber}, ${role}, ${bio}, ${resumeUrl}, ${resumePublicId}, FALSE) RETURNING user_id, name, email, phone_number, role, bio, resume, created_at`;
    registerdUser = user
  }

  if (!registerdUser) {
    throw new ErrorHandler(500, 'Unable to create the user account.');
  }

  await issueVerificationOtp(registerdUser.user_id, email);

  res.status(201).json({
    message: 'Registration successful. Enter the OTP sent to your email.',
    registerdUser,
    email,
    requiresVerification: true,
  })
})

export const verifyEmailOtp = TryCatch(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp || !/^\d{6}$/.test(String(otp))) {
    throw new ErrorHandler(400, 'Email and a valid 6-digit OTP are required.');
  }

  const [verification] = await sql`
    SELECT u.user_id, u.is_verified, ev.code_hash, ev.expires_at, ev.attempts
    FROM users u
    LEFT JOIN email_verifications ev ON ev.user_id = u.user_id
    WHERE u.email = ${email}
  `;

  if (!verification) throw new ErrorHandler(404, 'No account was found for this email.');
  if (verification.is_verified) throw new ErrorHandler(400, 'This email is already verified. Please log in.');
  if (!verification.code_hash || new Date(verification.expires_at).getTime() < Date.now()) {
    throw new ErrorHandler(400, 'This OTP has expired. Please request a new one.');
  }
  if (verification.attempts >= MAX_OTP_ATTEMPTS) {
    throw new ErrorHandler(429, 'Too many incorrect attempts. Please request a new OTP.');
  }
  if (hashOtp(String(otp)) !== verification.code_hash) {
    await sql`UPDATE email_verifications SET attempts = attempts + 1 WHERE user_id = ${verification.user_id}`;
    throw new ErrorHandler(400, 'Invalid OTP.');
  }

  const [user] = await sql`
    UPDATE users SET is_verified = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ${verification.user_id}
    RETURNING user_id, name, email, phone_number, role, bio, resume, profile_pic, subscription, created_at
  `;
  await sql`DELETE FROM email_verifications WHERE user_id = ${verification.user_id}`;

  const jwtSecret = process.env.JWT_SEC || process.env.JWT_SECRET;
  if (!jwtSecret) throw new ErrorHandler(500, 'JWT secret is not configured on the server.');
  const token = jwt.sign({ id: user.user_id }, jwtSecret, { expiresIn: '15d' });

  res.json({ message: 'Email verified successfully.', user, token });
});

export const resendVerificationOtp = TryCatch(async (req, res, next) => {
  const { email } = req.body;
  if (!email) throw new ErrorHandler(400, 'Email is required.');

  const [user] = await sql`SELECT user_id, is_verified FROM users WHERE email = ${email}`;
  if (!user) throw new ErrorHandler(404, 'No account was found for this email.');
  if (user.is_verified) throw new ErrorHandler(400, 'This email is already verified. Please log in.');

  await issueVerificationOtp(user.user_id, email, true);
  res.json({ message: 'A new OTP has been sent to your email.', email, requiresVerification: true });
});

 export const loginUser = TryCatch(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ErrorHandler(400, "Please fill all details..")
  }
  const user = await sql`
  SELECT
u.user_id,
u.name,
u.email,
u.password,
u.phone_number,
u.role,
u.bio,
u.resume,
u.profile_pic,
u.subscription,
u.is_verified,
ARRAY_AGG(s.name)
FILTER (WHERE s.name IS NOT NULL) AS skills
FROM users u
LEFT JOIN user_skills us
ON u.user_id = us.user_id
LEFT JOIN skills s ON us.skill_id = s.skill_id
WHERE u.email = ${email}
GROUP BY u.user_id;
  `;

  if(user.length === 0){
    throw new ErrorHandler(400, "Invalid Credentials..");
  }

  const userObject = user[0];

  if (!userObject.is_verified) {
    throw new ErrorHandler(403, 'Please verify your email before logging in.');
  }

  const matchPassword = await bcrypt.compare(password, userObject.password);

  if(!matchPassword){
    throw new ErrorHandler(400, "Wrong Password")
  }

  userObject.skills = userObject.skills || [];

  delete userObject.password;

  const jwtSecret = process.env.JWT_SEC || process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new ErrorHandler(500, "JWT secret is not configured on the server.");
  }

  const token = jwt.sign({ id: userObject?.user_id }, jwtSecret, { expiresIn: "15d" })

  res.json({
    message: "User logged in successfully",
    user: userObject,
    userObject,
    token
  })

})

export default registerUser;
