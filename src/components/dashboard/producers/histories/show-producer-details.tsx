import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Producer } from "@/types";
import { Dispatch, SetStateAction } from "react";
import { Table, TableBody, TableCell, TableCaption, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { Ban } from "lucide-react";

interface ShowProducerDetailsProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>
  producer: Producer
}

export const ShowProducerDetails = ({ open, setOpen, producer }: ShowProducerDetailsProps) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!max-w-4xl w-full !max-h-[calc(100vh-10rem)]">
        <DialogHeader>
          <DialogTitle>Detalles de la produccion</DialogTitle>
          <DialogDescription>
            {producer.details.length} {producer.details.length === 1 ? "producto" : "productos"}
          </DialogDescription>
        </DialogHeader>
        <div className="my-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Unidad M.</TableHead>
                {/* <TableHead className="w-[120px]">Acciones</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {
                producer.details.map((detail) => (
                  <TableRow key={detail.id}>
                    <TableCell className="capitalize">{detail.inventaryItems[0].product?.name}</TableCell>
                    <TableCell>{detail.quantity} UND</TableCell>
                    <TableCell>{detail.measureUnitValue} {detail.inventaryItems[0].product?.inputProduct?.measureUnit}</TableCell>
                    {/* <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                          >
                            <Ban />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Anular producto</p>
                        </TooltipContent>
                      </Tooltip>

                    </TableCell> */}
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <div className="flex justify-end items-center gap-2">
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
            >
              Cerrar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};