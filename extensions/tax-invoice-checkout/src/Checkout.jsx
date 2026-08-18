import { useState } from "react";
import { reactExtension, BlockStack, Checkbox, Text, TextField, Select, useApplyAttributeChange } from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => <TaxInvoiceBlock />);

function TaxInvoiceBlock() {
  const applyAttributeChange = useApplyAttributeChange();
  const [requested, setRequested] = useState(false);
  const [buyerType, setBuyerType] = useState("individual");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [taxId, setTaxId] = useState("");
  const [branch, setBranch] = useState("00000");
  const [address, setAddress] = useState("");

  async function update(nextRequested = requested) {
    await applyAttributeChange({ key: "tax_invoice_requested", value: String(nextRequested) });
    await applyAttributeChange({
      key: "tax_invoice_buyer",
      value: JSON.stringify({ buyerType, name, email, taxId, branch, address }),
    });
  }

  return (
    <BlockStack spacing="base">
      <Text emphasis="bold">Request a Thai Tax Invoice / ขอใบกำกับภาษี</Text>
      <Checkbox checked={requested} onChange={(value) => { setRequested(value); update(value); }}>
        I need a Tax Invoice
      </Checkbox>
      {requested && <BlockStack spacing="base">
        <Select label="Buyer type" value={buyerType} onChange={(value) => { setBuyerType(value); update(); }} options={[{ value: "individual", label: "Individual" }, { value: "company", label: "Company / VAT registered" }]} />
        <TextField label="Buyer name" value={name} onChange={(value) => { setName(value); update(); }} />
        <TextField label="Email for Tax Invoice" value={email} onChange={(value) => { setEmail(value); update(); }} type="email" />
        {buyerType === "company" && <TextField label="Tax ID" value={taxId} onChange={(value) => { setTaxId(value); update(); }} />}
        {buyerType === "company" && <TextField label="Branch number" value={branch} onChange={(value) => { setBranch(value); update(); }} />}
        <TextField label="Registered address" value={address} onChange={(value) => { setAddress(value); update(); }} />
      </BlockStack>}
    </BlockStack>
  );
}
