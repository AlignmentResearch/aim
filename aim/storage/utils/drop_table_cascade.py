from sqlalchemy.schema import DropTable
from sqlalchemy.ext.compiler import compiles

@compiles(DropTable, "postgresql")
def _compile_drop_table(element, compiler, **kwargs):
    """
    Ensures tables are dropped with CASCADE in PostgreSQL.
    This prevents errors when dropping tables that have dependencies.

    Source: https://stackoverflow.com/a/38679457/4521118

    Args:
        element: The DropTable element
        compiler: The SQL compiler
        **kwargs: Additional compiler arguments

    Returns:
        str: The SQL DROP TABLE command with CASCADE
    """
    return compiler.visit_drop_table(element) + " CASCADE"