import { TxReceipt } from "./tx_receipt.js";
import { trimPrefix, fromHexString } from "./utils.js";
import assert from "assert";

function eventTo7Offsets(event, receiptBaseOffset) {
  let rst = [event.address_offset[0] + receiptBaseOffset];

  for (let i = 0; i < 4; i++) {
    rst.push(
      i < event.topics.length
        ? event.topics_offset[i][0] + receiptBaseOffset
        : 0,
    );
  }

  rst.push(event.data_offset[0] + receiptBaseOffset);
  rst.push(event.data.length);
  return rst;
}

function cleanReceipt(r) {
  return trimPrefix(trimPrefix(r, "0x"), "02");
}

export function rlpDecodeAndEventFilter(rawreceiptList, srcAddr, srcEsigs) {
  const filteredRawReceiptList = [];
  const filteredEventsList = [];

  for (let i in rawreceiptList) {
    const es = TxReceipt.fromRawStr(rawreceiptList[i]).filter(
      srcAddr,
      srcEsigs,
    );
    if (es.length > 0) {
      filteredRawReceiptList.push(rawreceiptList[i]);
      filteredEventsList.push(es);
    }
  }
  return [filteredRawReceiptList, filteredEventsList];
}

export function genStreamAndMatchedEventOffsets(rawreceiptList, eventList) {
  let matched_offset_list = [];
  let accumulateReceiptLength = 0;
  let rawreceipts = "";

  assert(rawreceiptList.length == eventList.length);

  for (let rcpid in rawreceiptList) {
    const es = eventList[rcpid];
    matched_offset_list = matched_offset_list.concat(
      ...es.map((e) => eventTo7Offsets(e, accumulateReceiptLength)),
    );

    var r = cleanReceipt(rawreceiptList[rcpid]);
    rawreceipts += r;

    accumulateReceiptLength += Math.ceil(r.length / 2);
  }

  return [fromHexString(rawreceipts), matched_offset_list];
}

// Format inputs with length and input value
export function formatVarLenInput(inputs) {
  var formatted = "";
  inputs.map((input) => {
    formatted += `0x${Math.ceil(input.length / 2).toString(
      16,
    )}:i64 0x${input}:bytes-packed `;
  });
  return formatted;
}
