Include the following lines at the appropriate locations in a web csproj file.

Put these settings among the other <ItemGroup> nodes...

  <ItemGroup>
    <Content Include="..\..\XWeb\**\*.css;..\..\XWeb\**\*.js;..\..\XWeb\**\*.png">
      <Link>wwwroot\XWeb\%(RecursiveDir)%(FileName)%(Extension)</Link>
    </Content>
    <XWeb Include="..\..\XWeb\**\*.css;..\..\XWeb\**\*.js;..\..\XWeb\**\*.png" />    
  </ItemGroup>

Put these settings at the end of the csproj file right before the </Project> closer...

  <Target Name="CopyXWeb" BeforeTargets="Build">
    <Copy SourceFiles="@(XWeb)"
          DestinationFiles="wwwroot\XWeb\%(RecursiveDir)%(Filename)%(Extension)"
          SkipUnchangedFiles="true"
          OverwriteReadOnlyFiles="true" />
  </Target>
